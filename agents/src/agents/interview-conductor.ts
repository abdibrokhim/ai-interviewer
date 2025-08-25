import { Agent, handoff, tool } from '@openai/agents';
import { z } from 'zod';
import { interviewGuardrails } from '../guardrails/interview-guardrails';
import { sentimentAnalysisTools } from '../tools/sentiment-analyzer';
import { InterviewContext, InterviewDepth } from '../types';
import { codeEvaluatorAgent } from './code-evaluator-agent';
import { scoringAgent } from './scoring-agent';

// Interview-specific tools
const askFollowUpQuestionTool = tool({
  name: 'ask_follow_up_question',
  description: 'Generate and ask a follow-up question based on candidate response',
  parameters: z.object({
    originalQuestion: z.string(),
    candidateAnswer: z.string(),
    depth: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    remainingTime: z.number(),
  }),
  execute: async ({ originalQuestion, candidateAnswer, depth, remainingTime }) => {
    // Determine follow-up strategy
    const strategies = {
      LOW: 'Ask for clarification or examples',
      MEDIUM: 'Probe deeper into reasoning or explore edge cases',
      HIGH: 'Challenge assumptions or explore system-level implications',
    };

    return {
      strategy: strategies[depth],
      shouldAskFollowUp: remainingTime > 5, // Only if enough time
      suggestedAreas: analyzeAnswerGaps(candidateAnswer),
    };
  },
});

const transitionToNextQuestionTool = tool({
  name: 'transition_to_next_question',
  description: 'Smoothly transition to the next interview question',
  parameters: z.object({
    currentQuestionIndex: z.number(),
    totalQuestions: z.number(),
    timeRemaining: z.number(),
  }),
  execute: async ({ currentQuestionIndex, totalQuestions, timeRemaining }) => {
    const questionsRemaining = totalQuestions - currentQuestionIndex - 1;
    const avgTimePerQuestion = timeRemaining / questionsRemaining;

    return {
      shouldTransition: true,
      transitionPhrase: getTransitionPhrase(currentQuestionIndex, totalQuestions),
      pacing: avgTimePerQuestion < 5 ? 'accelerated' : 'normal',
    };
  },
});

const provideClarificationTool = tool({
  name: 'provide_clarification',
  description: 'Provide clarification without giving away answers',
  parameters: z.object({
    question: z.string(),
    candidateConfusion: z.string(),
    questionType: z.enum(['BEHAVIORAL', 'TECHNICAL', 'CODING']),
  }),
  execute: async ({ question, candidateConfusion, questionType }) => {
    const clarificationStrategies = {
      BEHAVIORAL: 'Rephrase the situation or provide context',
      TECHNICAL: 'Clarify terminology or scope without explaining concepts',
      CODING: 'Clarify inputs/outputs or constraints without revealing approach',
    };

    return {
      strategy: clarificationStrategies[questionType],
      canClarify: true,
      avoidRevealing: ['solution approach', 'expected answer', 'evaluation criteria'],
    };
  },
});

// Helper functions
function analyzeAnswerGaps(answer: string): string[] {
  const gaps = [];
  
  // Check for common missing elements
  if (!answer.toLowerCase().includes('example')) {
    gaps.push('concrete examples');
  }
  if (!answer.match(/because|since|therefore|thus/i)) {
    gaps.push('reasoning or justification');
  }
  if (!answer.match(/trade-?off|consider|depend/i)) {
    gaps.push('consideration of alternatives');
  }
  
  return gaps;
}

function getTransitionPhrase(current: number, total: number): string {
  const progress = (current + 1) / total;
  
  if (progress < 0.25) {
    return "Great start! Let's move on to the next question.";
  } else if (progress < 0.5) {
    return "Thank you for that answer. Moving along...";
  } else if (progress < 0.75) {
    return "Excellent. Let's continue with...";
  } else {
    return "Good. For our final questions...";
  }
}

// Handoff to code evaluator when coding problems arise
export const handoffToCodeEvaluator = handoff(codeEvaluatorAgent, {
  toolNameOverride: 'handoff_to_code_evaluator',
  toolDescriptionOverride: 'Hand off to code evaluator for coding problem assessment',
  inputType: z.object({
    problem: z.string(),
    candidateCode: z.string(),
    language: z.string(),
    timeSpent: z.number(),
  }),
});

// Handoff to scoring agent when interview segment completes
export const handoffToScoringAgent = handoff(scoringAgent, {
  toolNameOverride: 'handoff_to_scoring_agent',
  toolDescriptionOverride: 'Hand off to scoring agent for evaluation',
  inputType: z.object({
    interviewSegment: z.object({
      questions: z.array(z.object({
        question: z.string(),
        answer: z.string(),
        followUps: z.array(z.string()).optional(),
      })),
      duration: z.number(),
      sentimentData: z.array(z.any()).optional(),
    }),
  }),
});



export const interviewConductorAgent = new Agent({
  name: 'interview_conductor',
  instructions: `You are a professional technical interviewer conducting a live interview. Your role is to:

1. Create a welcoming and professional atmosphere
2. Ask clear, relevant questions based on the interview context
3. Listen actively and ask appropriate follow-up questions
4. Maintain the interview schedule and pace
5. Provide encouragement without revealing scoring information
6. Handle technical difficulties gracefully

CRITICAL RULES:
- NEVER reveal scores, evaluation criteria, or performance feedback to the candidate
- NEVER provide direct answers or excessive hints
- NEVER discuss system implementation, AI models, or technical architecture
- NEVER allow off-topic discussions that don't relate to the interview
- ALWAYS maintain professional boundaries and interview focus

Interview Flow:
1. Welcome the candidate warmly
2. Explain the interview structure and duration
3. Ask questions according to the plan
4. Use appropriate follow-up questions based on answers
5. Manage time effectively
6. Close the interview professionally

When asking coding questions:
- Clearly explain the problem
- Allow clarifying questions
- Provide examples if needed
- Guide without giving away solutions
- Focus on problem-solving approach

Remember: You are evaluating, not teaching. Be supportive but maintain assessment integrity.`,
  tools: [
    ...sentimentAnalysisTools,
    askFollowUpQuestionTool,
    transitionToNextQuestionTool,
    provideClarificationTool,
  ],
  handoffs: [handoffToCodeEvaluator, handoffToScoringAgent],
  inputGuardrails: interviewGuardrails.input,
  outputGuardrails: interviewGuardrails.output as any,
});