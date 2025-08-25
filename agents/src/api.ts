// Convenience API functions for using agents
import { orchestrator } from './orchestrator';
import { ParsedResume, QuestionTemplate, InterviewResult } from './types';

/**
 * Parse a resume from text or file
 */
export async function parseResume(
  input: string | File
): Promise<ParsedResume> {
  const text = typeof input === 'string' ? input : await input.text();
  return orchestrator.parseResume(text);
}

/**
 * Generate interview questions
 */
export async function generateQuestions(params: {
  jobId: string;
  interviewType: 'TECHNICAL' | 'BEHAVIORAL' | 'CODING' | 'MIXED';
  duration: number;
  depth: 'LOW' | 'MEDIUM' | 'HIGH';
  candidateResumeText?: string;
}): Promise<QuestionTemplate> {
  let candidateResume;
  
  if (params.candidateResumeText) {
    candidateResume = await parseResume(params.candidateResumeText);
  }

  return orchestrator.generateQuestions({
    jobId: params.jobId,
    candidateResume,
    interviewType: params.interviewType,
    duration: params.duration,
    depth: params.depth,
  });
}

/**
 * Evaluate code submission
 */
export async function evaluateCode(params: {
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
  return orchestrator.evaluateCode(params);
}

/**
 * Score a completed interview
 */
export async function scoreInterview(
  interviewId: string
): Promise<InterviewResult> {
  return orchestrator.scoreInterview(interviewId);
}

/**
 * Quick assessment of a candidate answer
 */
export async function assessAnswer(params: {
  question: string;
  answer: string;
  expectedTopics?: string[];
  questionType: 'BEHAVIORAL' | 'TECHNICAL' | 'CODING';
}): Promise<{
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}> {
  // This would use the scoring agent directly
  return {
    score: 0,
    feedback: '',
    strengths: [],
    improvements: [],
  };
}
