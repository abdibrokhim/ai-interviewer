import { Agent, handoff } from '@openai/agents';
import { questionGeneratorTools } from '../tools/question-generator';
import { z } from 'zod';
import { InterviewContext, QuestionTemplate } from '../types';
import { interviewConductorAgent } from './interview-conductor';

// Generate a complete interview question set
export async function generateInterviewQuestions(
  agent: Agent,
  context: {
    jobDescription: string;
    requiredSkills: string[];
    preferredSkills: string[];
    interviewType: string;
    duration: number;
    candidateResume?: any;
  }
): Promise<QuestionTemplate> {
  const { jobDescription, requiredSkills, interviewType, duration, candidateResume } = context;

  // Calculate question distribution
  const questionCount = Math.floor(duration / 10); // Roughly 10 minutes per question
  const distribution = calculateQuestionDistribution(interviewType, questionCount);

  const prompt = `
Generate ${questionCount} interview questions for the following context:

Job Description:
${jobDescription}

Required Skills:
${requiredSkills.join(', ')}

Interview Type: ${interviewType}
Duration: ${duration} minutes

${candidateResume ? `
Candidate Background:
- Experience Level: ${candidateResume.experienceLevel}
- Key Skills: ${candidateResume.skills.join(', ')}
- Recent Role: ${candidateResume.recentRole}
` : ''}

Please generate questions with the following distribution:
${JSON.stringify(distribution, null, 2)}

For each question include:
1. The question text
2. Expected topics/themes in the answer
3. Follow-up questions
4. Time allocation
5. Evaluation criteria
6. Difficulty level

Ensure questions progress logically and cover different aspects of the role.
`;

  // This would be processed by the agent
  return {} as QuestionTemplate;
}

// Helper to calculate question distribution
function calculateQuestionDistribution(
  interviewType: string,
  totalQuestions: number
): Record<string, number> {
  const distributions: Record<string, Record<string, number>> = {
    TECHNICAL: {
      conceptual: Math.floor(totalQuestions * 0.4),
      practical: Math.floor(totalQuestions * 0.4),
      system_design: Math.floor(totalQuestions * 0.2),
    },
    BEHAVIORAL: {
      experience: Math.floor(totalQuestions * 0.4),
      situational: Math.floor(totalQuestions * 0.3),
      motivation: Math.floor(totalQuestions * 0.3),
    },
    CODING: {
      warmup: Math.floor(totalQuestions * 0.2),
      medium: Math.floor(totalQuestions * 0.5),
      challenging: Math.floor(totalQuestions * 0.3),
    },
    MIXED: {
      behavioral: Math.floor(totalQuestions * 0.3),
      technical: Math.floor(totalQuestions * 0.3),
      coding: Math.floor(totalQuestions * 0.4),
    },
  };

  return distributions[interviewType] || distributions.MIXED;
}

// Generate follow-up questions based on answer
export async function generateFollowUpQuestion(
  agent: Agent,
  context: {
    originalQuestion: string;
    candidateAnswer: string;
    questionType: string;
    depth: 'LOW' | 'MEDIUM' | 'HIGH';
    timeRemaining: number;
  }
): Promise<{ question: string; rationale: string }> {
  const { originalQuestion, candidateAnswer, questionType, depth, timeRemaining } = context;

  if (timeRemaining < 3) {
    return {
      question: '',
      rationale: 'Insufficient time for follow-up',
    };
  }

  const depthStrategies = {
    LOW: 'Ask for clarification or specific examples',
    MEDIUM: 'Explore edge cases or alternative approaches',
    HIGH: 'Challenge assumptions or explore system-level implications',
  };

  const prompt = `
Original Question: ${originalQuestion}
Candidate Answer: ${candidateAnswer}
Question Type: ${questionType}
Depth Level: ${depth}
Strategy: ${depthStrategies[depth]}

Generate a follow-up question that:
1. Builds on the candidate's answer
2. Explores deeper understanding
3. Can be answered in ${Math.min(timeRemaining, 5)} minutes
4. Reveals additional insights about the candidate's knowledge

Provide the question and a brief rationale for why this follow-up is valuable.
`;

  // This would be processed by the agent
  return { question: '', rationale: '' };
}

// Handoff to interview conductor when questions are ready
export const handoffToInterviewConductor = handoff(interviewConductorAgent, {
  toolNameOverride: 'handoff_to_interview_conductor',
  toolDescriptionOverride: 'Hand off generated questions to interview conductor',
  inputType: z.object({
    questions: z.array(z.object({
      id: z.string(),
      text: z.string(),
      type: z.string(),
      timeAllocation: z.number(),
      evaluationCriteria: z.array(z.string()),
    })),
    interviewContext: z.any(),
  }),
});

export const questionGeneratorAgent = new Agent({
  name: 'question_generator',
  instructions: `You are an expert interview question designer. Your role is to:

1. Generate relevant, challenging, and fair interview questions
2. Tailor questions to the specific role and candidate background
3. Ensure questions assess both technical skills and problem-solving ability
4. Create a balanced mix of question types and difficulties
5. Design questions that reveal depth of knowledge and experience

Question Design Principles:
- Open-ended to encourage detailed responses
- Scenario-based to assess real-world application
- Progressive difficulty to gauge skill ceiling
- Unbiased and inclusive language
- Clear and unambiguous wording

For BEHAVIORAL questions:
- Use STAR method format
- Focus on recent, relevant experiences
- Probe for specific actions and outcomes
- Assess soft skills and cultural fit
- Include questions about challenges and failures

For TECHNICAL questions:
- Test conceptual understanding, not memorization
- Include practical application scenarios
- Allow multiple valid approaches
- Assess problem decomposition skills
- Include system design for senior roles

For CODING questions:
- Start with clear problem statements
- Provide input/output examples
- Include edge cases in evaluation
- Focus on problem-solving approach
- Consider time/space complexity discussions

Customization based on:
- Candidate's experience level
- Specific skills listed on resume
- Company's tech stack and values
- Role requirements and responsibilities
- Interview duration constraints

Ensure questions are:
- Relevant to the day-to-day work
- Appropriate for the experience level
- Diverse in topics and skills tested
- Time-boxed appropriately
- Accompanied by evaluation criteria`,
  tools: questionGeneratorTools,
  handoffs: [handoffToInterviewConductor],
});