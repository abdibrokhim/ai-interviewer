import { z } from 'zod';

// Interview Types
export const InterviewTypeEnum = z.enum(['TECHNICAL', 'CODING', 'BEHAVIORAL', 'SITUATIONAL', 'MIXED']);
export type InterviewType = z.infer<typeof InterviewTypeEnum>;

export const InterviewDepthEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type InterviewDepth = z.infer<typeof InterviewDepthEnum>;

// Interview Context
export const InterviewContextSchema = z.object({
  interviewId: z.string().uuid(),
  candidateId: z.string().uuid().optional(),
  candidateName: z.string(),
  candidateEmail: z.string().email(),
  companyId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  interviewType: InterviewTypeEnum,
  skills: z.array(z.string()),
  depth: InterviewDepthEnum,
  duration: z.number().min(10).max(120),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    category: z.string(),
    expectedTopics: z.array(z.string()).optional(),
    difficulty: InterviewDepthEnum,
  })),
  resumeData: z.object({
    skills: z.array(z.string()),
    experience: z.array(z.object({
      company: z.string(),
      role: z.string(),
      duration: z.string(),
      description: z.string().optional(),
    })),
    education: z.array(z.object({
      degree: z.string(),
      institution: z.string(),
      year: z.string().optional(),
    })),
  }).optional(),
});

export type InterviewContext = z.infer<typeof InterviewContextSchema>;

// Resume Parser Types
export const ParsedResumeSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()),
  experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    duration: z.string().optional(),
    description: z.string().optional(),
    achievements: z.array(z.string()).optional(),
  })),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.string().optional(),
    gpa: z.string().optional(),
  })),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  githubUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
});

export type ParsedResume = z.infer<typeof ParsedResumeSchema>;

// Scoring Types
export const ScoreSchema = z.object({
  communication: z.number().min(0).max(100),
  technical: z.number().min(0).max(100),
  problemSolving: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
});

export type Score = z.infer<typeof ScoreSchema>;

export const InterviewResultSchema = z.object({
  interviewId: z.string().uuid(),
  candidateId: z.string().uuid().optional(),
  scores: ScoreSchema,
  transcript: z.string(),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
  flaggedBehaviors: z.array(z.object({
    type: z.enum(['TAB_SWITCH', 'MULTIPLE_FACES', 'NO_FACE', 'SUSPICIOUS_AUDIO', 'OFF_TOPIC']),
    timestamp: z.string(),
    description: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })).optional(),
  questionsAnswered: z.array(z.object({
    questionId: z.string(),
    question: z.string(),
    answer: z.string(),
    score: z.number().min(0).max(100),
    feedback: z.string(),
  })),
  codeSubmissions: z.array(z.object({
    problemId: z.string(),
    problem: z.string(),
    code: z.string(),
    language: z.string(),
    testResults: z.array(z.object({
      passed: z.boolean(),
      input: z.string(),
      expectedOutput: z.string(),
      actualOutput: z.string(),
      executionTime: z.number().optional(),
    })),
    score: z.number().min(0).max(100),
    feedback: z.string(),
  })).optional(),
  duration: z.number(),
  completedAt: z.string(),
});

export type InterviewResult = z.infer<typeof InterviewResultSchema>;

// Question Generation Types
export const QuestionTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  jobRole: z.string(),
  category: z.enum(['BEHAVIORAL', 'TECHNICAL', 'CODING', 'SITUATIONAL']),
  questions: z.array(z.object({
    text: z.string(),
    difficulty: InterviewDepthEnum,
    expectedTopics: z.array(z.string()).optional(),
    followUpQuestions: z.array(z.string()).optional(),
  })),
});

export type QuestionTemplate = z.infer<typeof QuestionTemplateSchema>;

// Code Evaluation Types
export const CodeProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })),
  constraints: z.array(z.string()),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    isHidden: z.boolean().default(false),
  })),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  topics: z.array(z.string()),
  timeLimit: z.number().optional(),
  memoryLimit: z.number().optional(),
});

export type CodeProblem = z.infer<typeof CodeProblemSchema>;

// Sentiment Analysis Types
export const SentimentDataSchema = z.object({
  timestamp: z.string(),
  audioSentiment: z.object({
    confidence: z.number().min(0).max(1),
    pace: z.enum(['SLOW', 'NORMAL', 'FAST']),
    tone: z.enum(['NERVOUS', 'CONFIDENT', 'NEUTRAL', 'STRESSED']),
    volume: z.enum(['LOW', 'NORMAL', 'HIGH']),
  }).optional(),
  facialSentiment: z.object({
    detected: z.boolean(),
    emotion: z.enum(['HAPPY', 'NEUTRAL', 'STRESSED', 'CONFUSED', 'FOCUSED']).optional(),
    eyeContact: z.number().min(0).max(1).optional(),
    faceCount: z.number(),
  }).optional(),
});

export type SentimentData = z.infer<typeof SentimentDataSchema>;
