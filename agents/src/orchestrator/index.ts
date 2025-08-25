import { run } from '@openai/agents';
import { interviewConductorAgent } from '../agents/interview-conductor';
import { resumeParserAgent } from '../agents/resume-parser-agent';
import { questionGeneratorAgent } from '../agents/question-generator-agent';
import { scoringAgent } from '../agents/scoring-agent';
import { codeEvaluatorAgent } from '../agents/code-evaluator-agent';
import { InterviewContext, ParsedResume, InterviewResult, QuestionTemplate } from '../types';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

export class InterviewOrchestrator {
  private agents = {
    resumeParser: resumeParserAgent,
    questionGenerator: questionGeneratorAgent,
    interviewer: interviewConductorAgent,
    codeEvaluator: codeEvaluatorAgent,
    scorer: scoringAgent,
  };

  /**
   * Parse a resume and extract structured information
   */
  async parseResume(resumeText: string): Promise<ParsedResume> {
    const result = await run(
      this.agents.resumeParser,
      `Parse this resume and extract all relevant information:
      
      ${resumeText}
      
      Extract:
      1. Personal information (name, email, phone)
      2. Technical skills by category
      3. Work experience with achievements
      4. Education and certifications
      5. Online presence (GitHub, LinkedIn)
      
      Return structured JSON data.`
    );

    return JSON.parse(result.output.toString());
  }

  /**
   * Generate interview questions based on job and candidate
   */
  async generateQuestions(params: {
    jobId: string;
    candidateResume?: ParsedResume;
    interviewType: string;
    duration: number;
    depth: string;
  }): Promise<QuestionTemplate> {
    // Fetch job details
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.jobId)
      .single();

    if (!job) throw new Error('Job not found');

    const result = await run(
      this.agents.questionGenerator,
      `Generate interview questions for:
      
      Job: ${job.title}
      Description: ${job.description}
      Required Skills: ${job.tech_stack.join(', ')}
      
      Interview Type: ${params.interviewType}
      Duration: ${params.duration} minutes
      Depth: ${params.depth}
      
      ${params.candidateResume ? `
      Candidate Background:
      Skills: ${params.candidateResume.skills.join(', ')}
      Experience: ${params.candidateResume.experience.length} positions
      ` : ''}
      
      Generate a balanced set of questions appropriate for the role and candidate.`
    );

    return JSON.parse(result.output.toString());
  }

  /**
   * Conduct an interview segment (for non-realtime scenarios)
   */
  async conductInterviewSegment(
    context: InterviewContext,
    candidateInput: string
  ): Promise<{
    response: string;
    shouldContinue: boolean;
    nextQuestion?: string;
  }> {
    const result = await run(
      this.agents.interviewer,
      candidateInput,
      {
        context,
      }
    );

    return {
      response: result.output.toString(),
      shouldContinue: !result.output.toString().includes('end of our interview'),
      nextQuestion: result.newItems.find(item => item.type === 'message_output_item')?.rawItem.content.toString(),
    };
  }

  /**
   * Evaluate a code submission
   */
  async evaluateCode(params: {
    problemId: string;
    code: string;
    language: string;
    interviewId: string;
  }): Promise<{
    passed: boolean;
    score: number;
    feedback: string;
    testResults: any[];
  }> {
    // Fetch problem details
    const { data: problem } = await supabase
      .from('coding_problems')
      .select('*')
      .eq('id', params.problemId)
      .single();

    if (!problem) throw new Error('Problem not found');

    const result = await run(
      this.agents.codeEvaluator,
      `Evaluate this code submission:
      
      Problem: ${problem.title}
      ${problem.description}
      
      Code (${params.language}):
      \`\`\`${params.language}
      ${params.code}
      \`\`\`
      
      Run all test cases and provide comprehensive feedback.`
    );

    const evaluation = JSON.parse(result.output.toString());

    // Store code submission
    await this.storeCodeSubmission({
      interviewId: params.interviewId,
      problemId: params.problemId,
      ...evaluation,
    });

    return evaluation;
  }

  /**
   * Score a completed interview
   */
  async scoreInterview(interviewId: string): Promise<InterviewResult> {
    // Fetch interview data
    const { data: interview } = await supabase
      .from('interviews')
      .select(`
        *,
        interview_sessions(*),
        code_submissions(*),
        sentiment_data(*)
      `)
      .eq('id', interviewId)
      .single();

    if (!interview) throw new Error('Interview not found');

    const result = await run(
      this.agents.scorer,
      `Score this completed interview:
      
      Interview Type: ${interview.interview_type}
      Duration: ${interview.minutes_duration} minutes
      
      Transcript:
      ${interview.transcript}
      
      Code Submissions: ${interview.code_submissions.length}
      Sentiment Data Available: ${interview.sentiment_data.length > 0}
      
      Provide comprehensive scoring across all dimensions with detailed feedback.`
    );

    const scores = JSON.parse(result.output.toString());

    // Store results
    await this.storeInterviewResults({
      interviewId,
      ...scores,
    });

    return scores;
  }

  /**
   * Complete interview flow from start to finish
   */
  async runCompleteInterview(params: {
    interviewId: string;
    candidateId?: string;
    candidateEmail: string;
    jobId: string;
    companyId: string;
  }): Promise<{
    questionsGenerated: boolean;
    sessionCreated: boolean;
    inviteSent: boolean;
  }> {
    try {
      // 1. Parse candidate resume if available
      let candidateProfile;
      if (params.candidateId) {
        const { data: application } = await supabase
          .from('applications')
          .select('resume_url')
          .eq('candidate_id', params.candidateId)
          .eq('job_id', params.jobId)
          .single();

        if (application?.resume_url) {
          // Fetch and parse resume
          const resumeText = await this.fetchResumeText(application.resume_url);
          candidateProfile = await this.parseResume(resumeText);
        }
      }

      // 2. Generate interview questions
      const { data: interview } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', params.interviewId)
        .single();

      const questions = await this.generateQuestions({
        jobId: params.jobId,
        candidateResume: candidateProfile,
        interviewType: interview.interview_type,
        duration: interview.minutes_duration,
        depth: interview.depth,
      });

      // Store questions
      await this.storeInterviewQuestions(params.interviewId, questions);

      // 3. Create interview session
      const session = await this.createInterviewSession({
        interviewId: params.interviewId,
        questions,
        candidateEmail: params.candidateEmail,
      });

      // 4. Send invite
      const inviteSent = await this.sendInterviewInvite({
        interviewId: params.interviewId,
        candidateEmail: params.candidateEmail,
        sessionToken: session.token,
      });

      return {
        questionsGenerated: true,
        sessionCreated: true,
        inviteSent,
      };
    } catch (error) {
      console.error('Error in interview flow:', error);
      throw error;
    }
  }

  // Helper methods
  private async fetchResumeText(url: string): Promise<string> {
    // Implement resume fetching from storage
    return '';
  }

  private async storeCodeSubmission(data: any) {
    await supabase.from('code_submissions').insert(data);
  }

  private async storeInterviewResults(data: any) {
    await supabase.from('interview_results').insert(data);
  }

  private async storeInterviewQuestions(interviewId: string, questions: QuestionTemplate) {
    await supabase
      .from('interview_questions')
      .insert(
        questions.questions.map(q => ({
          interview_id: interviewId,
          ...q,
        }))
      );
  }

  private async createInterviewSession(params: any) {
    const { data } = await supabase
      .from('interview_sessions')
      .insert({
        interview_id: params.interviewId,
        scheduled_at: new Date().toISOString(),
        status: 'scheduled',
      })
      .select()
      .single();

    return data;
  }

  private async sendInterviewInvite(params: any): Promise<boolean> {
    // Implement email sending
    return true;
  }
}

// Singleton instance
export const orchestrator = new InterviewOrchestrator();

// Utility functions for common operations
export async function prepareInterview(jobId: string, candidateEmail: string): Promise<{
  interviewId: string;
  questions: QuestionTemplate;
  sessionUrl: string;
}> {
  // Implementation
  return {
    interviewId: '',
    questions: {} as QuestionTemplate,
    sessionUrl: '',
  };
}

export async function processInterviewResults(
  interviewId: string
): Promise<InterviewResult> {
  return orchestrator.scoreInterview(interviewId);
}

export async function handleResumeUpload(
  resumeFile: File,
  candidateId: string
): Promise<ParsedResume> {
  // Convert file to text
  const text = await resumeFile.text();
  
  // Parse resume
  const parsed = await orchestrator.parseResume(text);
  
  // Update candidate profile
  await supabase
    .from('users')
    .update({
      skills: parsed.skills,
      // Other fields
    })
    .eq('id', candidateId);

  return parsed;
}
