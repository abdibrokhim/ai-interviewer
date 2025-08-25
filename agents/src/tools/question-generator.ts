import { tool } from '@openai/agents'
import { z } from 'zod'
import { InterviewTypeEnum, InterviewDepthEnum } from '../types'

export const generateQuestionsTool = tool({
  name: 'generate_questions',
  description: 'Generate interview questions based on job description and requirements',
  parameters: z.object({
    jobDescription: z.string(),
    interviewType: InterviewTypeEnum,
    skills: z.array(z.string()),
    experienceLevel: z.enum(['junior', 'mid', 'senior', 'lead']),
    depth: InterviewDepthEnum,
    count: z.number().min(1).max(20).default(5),
  }),
  execute: async ({ jobDescription, interviewType, skills, experienceLevel, depth, count }: { jobDescription: string; interviewType: any; skills: string[]; experienceLevel: 'junior' | 'mid' | 'senior' | 'lead'; depth: any; count: number }) => {
    // This returns a template for the AI agent to use
    // The actual question generation will be done by the LLM
    const questionGuidelines = {
      interviewType,
      depth,
      experienceLevel,
      focusAreas: skills,
      guidelines: getQuestionGuidelines(interviewType, depth, experienceLevel),
      exampleStructure: getExampleQuestionStructure(interviewType),
      count,
    }

    return {
      generatePrompt: true,
      guidelines: questionGuidelines,
      jobContext: jobDescription,
    }
  },
})

export const loadQuestionTemplateTool = tool({
  name: 'load_question_template',
  description: 'Load pre-defined question templates for common roles',
  parameters: z.object({
    jobRole: z.string(),
    templateId: z.string().optional(),
  }),
  execute: async ({ jobRole, templateId }: { jobRole: string; templateId?: string }) => {
    // Pre-defined templates for common roles
    const templates: Record<string, any> = {
      'software_engineer_i': {
        title: 'Software Engineer I - General',
        questions: {
          behavioral: [
            {
              text: 'Tell me about a challenging bug you fixed.',
              difficulty: 'LOW',
              expectedTopics: ['problem-solving', 'debugging', 'persistence'],
              followUpQuestions: [
                'How did you identify the root cause?',
                'What tools did you use?',
                'How did you prevent similar issues?',
              ],
            },
            {
              text: 'Describe a time you worked in a team.',
              difficulty: 'LOW',
              expectedTopics: ['collaboration', 'communication', 'conflict resolution'],
              followUpQuestions: [
                'What was your specific role?',
                'How did you handle disagreements?',
                'What did you learn from the experience?',
              ],
            },
          ],
          technical: [
            {
              text: 'Explain the difference between let, const, and var in JavaScript.',
              difficulty: 'LOW',
              expectedTopics: ['scope', 'hoisting', 'immutability'],
            },
            {
              text: 'What are REST API principles?',
              difficulty: 'MEDIUM',
              expectedTopics: ['HTTP methods', 'stateless', 'resources', 'status codes'],
            },
          ],
          coding: [
            {
              text: 'Implement a function to check if a string is a palindrome.',
              difficulty: 'LOW',
              timeLimit: 10,
              hints: ['Consider case sensitivity', 'Handle spaces and punctuation'],
            },
            {
              text: 'Find two numbers in an array that sum to a target value.',
              difficulty: 'MEDIUM',
              timeLimit: 15,
              hints: ['Think about time complexity', 'Consider using a hash map'],
            },
          ],
        },
      },
      'frontend_engineer': {
        title: 'Frontend Engineer',
        questions: {
          behavioral: [
            {
              text: 'How do you ensure UI/UX consistency across a large application?',
              difficulty: 'MEDIUM',
              expectedTopics: ['design systems', 'component libraries', 'testing'],
            },
          ],
          technical: [
            {
              text: 'Explain React hooks and their benefits.',
              difficulty: 'MEDIUM',
              expectedTopics: ['useState', 'useEffect', 'custom hooks', 'functional components'],
            },
            {
              text: 'How do you optimize web performance?',
              difficulty: 'HIGH',
              expectedTopics: ['lazy loading', 'bundling', 'caching', 'rendering'],
            },
          ],
          coding: [
            {
              text: 'Implement a debounce function.',
              difficulty: 'MEDIUM',
              timeLimit: 15,
            },
            {
              text: 'Create a React component for an autocomplete search.',
              difficulty: 'HIGH',
              timeLimit: 25,
            },
          ],
        },
      },
      'backend_engineer': {
        title: 'Backend Engineer',
        questions: {
          behavioral: [
            {
              text: 'Describe how you handled a production outage.',
              difficulty: 'HIGH',
              expectedTopics: ['incident response', 'root cause analysis', 'communication'],
            },
          ],
          technical: [
            {
              text: 'Explain database indexing and when to use it.',
              difficulty: 'MEDIUM',
              expectedTopics: ['B-trees', 'performance', 'trade-offs'],
            },
            {
              text: 'How do you design a scalable microservices architecture?',
              difficulty: 'HIGH',
              expectedTopics: ['service boundaries', 'communication', 'data consistency'],
            },
          ],
          coding: [
            {
              text: 'Design a rate limiter.',
              difficulty: 'HIGH',
              timeLimit: 30,
            },
            {
              text: 'Implement an LRU cache.',
              difficulty: 'HIGH',
              timeLimit: 25,
            },
          ],
        },
      },
    };

    const template = templateId ? templates[templateId] : templates[jobRole.toLowerCase().replace(/\s+/g, '_')]

    if (!template) {
      return {
        found: false,
        availableTemplates: Object.keys(templates),
      }
    }

    return {
      found: true,
      template,
      canCustomize: true,
    }
  },
})

export const customizeQuestionTool = tool({
  name: 'customize_question',
  description: 'Customize a question based on candidate background',
  parameters: z.object({
    originalQuestion: z.string(),
    candidateSkills: z.array(z.string()),
    candidateExperience: z.string(),
    depth: InterviewDepthEnum,
  }),
  execute: async ({ originalQuestion, candidateSkills, candidateExperience, depth }: { originalQuestion: string; candidateSkills: string[]; candidateExperience: string; depth: any }) => {
    // Provide guidance for question customization
    const customizationFactors = {
      relevantSkills: candidateSkills.filter(skill => 
        originalQuestion.toLowerCase().includes(skill.toLowerCase())
      ),
      experienceLevel: detectExperienceLevel(candidateExperience),
      depthAdjustment: getDepthAdjustment(depth),
    }

    return {
      originalQuestion,
      customizationFactors,
      shouldCustomize: customizationFactors.relevantSkills.length > 0,
    }
  },
})

// Helper functions
function getQuestionGuidelines(type: string, depth: string, level: string): string[] {
  const guidelines: string[] = [];

  // Type-specific guidelines
  if (type === 'BEHAVIORAL') {
    guidelines.push('Focus on past experiences and specific situations');
    guidelines.push('Use STAR method (Situation, Task, Action, Result)');
    guidelines.push('Probe for learnings and self-reflection');
  } else if (type === 'TECHNICAL') {
    guidelines.push('Test conceptual understanding, not just memorization');
    guidelines.push('Include real-world application scenarios');
    guidelines.push('Allow for different valid approaches');
  } else if (type === 'CODING') {
    guidelines.push('Start with problem understanding and clarification');
    guidelines.push('Evaluate problem-solving approach, not just the solution');
    guidelines.push('Consider time and space complexity discussions');
  }

  // Depth-specific guidelines
  if (depth === 'HIGH') {
    guidelines.push('Include follow-up questions to dig deeper');
    guidelines.push('Challenge assumptions and explore edge cases');
    guidelines.push('Assess ability to handle ambiguity');
  } else if (depth === 'MEDIUM') {
    guidelines.push('Balance between breadth and depth');
    guidelines.push('Include some challenging aspects');
  } else {
    guidelines.push('Focus on fundamental understanding');
    guidelines.push('Provide clear, unambiguous questions');
  }

  // Level-specific guidelines
  if (level === 'senior' || level === 'lead') {
    guidelines.push('Include system design and architecture questions');
    guidelines.push('Assess leadership and mentoring abilities');
    guidelines.push('Test strategic thinking and trade-off analysis');
  } else if (level === 'junior') {
    guidelines.push('Focus on fundamentals and learning ability');
    guidelines.push('Assess enthusiasm and growth potential');
    guidelines.push('Include questions about recent projects or learning');
  }

  return guidelines;
}

function getExampleQuestionStructure(type: string): any {
  const structures: Record<string, any> = {
    BEHAVIORAL: {
      mainQuestion: 'Tell me about a time when...',
      followUps: ['What was the outcome?', 'What would you do differently?', 'How did you measure success?'],
      evaluationCriteria: ['Clarity', 'Impact', 'Learning', 'Leadership'],
    },
    TECHNICAL: {
      mainQuestion: 'Explain how... works',
      followUps: ['What are the trade-offs?', 'How would you optimize it?', 'What alternatives exist?'],
      evaluationCriteria: ['Accuracy', 'Depth', 'Practical application', 'Communication'],
    },
    CODING: {
      problemStatement: 'Given..., implement a function that...',
      constraints: ['Time complexity should be...', 'Space complexity should be...'],
      examples: ['Input: ..., Output: ...'],
      evaluationCriteria: ['Correctness', 'Efficiency', 'Code quality', 'Problem-solving approach'],
    },
  };

  return structures[type] || structures.TECHNICAL;
}

function detectExperienceLevel(experience: string): string {
  const years = parseInt(experience.match(/(\d+)\s*year/i)?.[1] || '0');
  
  if (years >= 8) return 'senior';
  if (years >= 4) return 'mid';
  if (years >= 2) return 'junior';
  return 'entry';
}

function getDepthAdjustment(depth: string): string {
  const adjustments: Record<string, string> = {
    HIGH: 'Add complexity and ambiguity, expect detailed analysis',
    MEDIUM: 'Balance clarity with some challenging aspects',
    LOW: 'Keep straightforward and focused on fundamentals',
  };
  
  return adjustments[depth] || adjustments.MEDIUM;
}

export const questionGeneratorTools = [
  generateQuestionsTool,
  loadQuestionTemplateTool,
  customizeQuestionTool,
]
