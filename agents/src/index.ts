// Main entry point for AI Agents
export * from './types'
export * from './config'
export * from './orchestrator'
export * from './realtime/interview-session'

// Export individual agents
export { interviewConductorAgent } from './agents/interview-conductor'
export { resumeParserAgent } from './agents/resume-parser-agent'
export { questionGeneratorAgent } from './agents/question-generator-agent'
export { scoringAgent } from './agents/scoring-agent'
export { codeEvaluatorAgent } from './agents/code-evaluator-agent'

// Export tools
export * from './tools/code-evaluator'
export * from './tools/sentiment-analyzer'
export * from './tools/resume-parser'
export * from './tools/question-generator'

// Export guardrails
export * from './guardrails/interview-guardrails'

// Note: API key and tracing configuration should be set by the app at startup
// per Agents SDK Config guide. We avoid side-effects on import here.

// Export convenience functions
export { parseResume, generateQuestions, evaluateCode, scoreInterview } from './api'

// Re-export commonly used functions
export {
  createInterviewSession,
  InterviewSessionManager,
  InterviewRealtimeAgent,
} from './realtime/interview-session'

export {
  InterviewOrchestrator,
  orchestrator,
  prepareInterview,
  processInterviewResults,
  handleResumeUpload,
} from './orchestrator'
