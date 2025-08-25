import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import { Score, InterviewResult, SentimentData } from '../types';

// Evaluation tools
const evaluateResponseTool = tool({
  name: 'evaluate_response',
  description: 'Evaluate a single interview response',
  parameters: z.object({
    question: z.string(),
    answer: z.string(),
    expectedTopics: z.array(z.string()).optional(),
    questionType: z.enum(['BEHAVIORAL', 'TECHNICAL', 'CODING']),
    difficultyLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    timeSpent: z.number().optional(),
  }),
  async execute({ question, answer, expectedTopics, questionType, difficultyLevel }) {
    // Evaluation criteria based on question type
    const criteria = getEvaluationCriteria(questionType, difficultyLevel);
    
    // Check for key indicators
    const indicators = {
      hasStructure: checkAnswerStructure(answer, questionType),
      coversExpectedTopics: expectedTopics ? 
        checkTopicCoverage(answer, expectedTopics) : null,
      demonstratesDepth: checkDepthOfKnowledge(answer),
      showsPracticalUnderstanding: checkPracticalExamples(answer),
    };

    return {
      criteria,
      indicators,
      suggestedScore: calculateQuestionScore(indicators, difficultyLevel),
    };
  },
});

const calculateOverallScoreTool = tool({
  name: 'calculate_overall_score',
  description: 'Calculate overall interview scores',
  parameters: z.object({
    questionScores: z.array(z.object({
      questionId: z.string(),
      scores: z.object({
        communication: z.number(),
        technical: z.number(),
        problemSolving: z.number(),
        confidence: z.number(),
      }),
      weight: z.number().default(1),
    })),
    sentimentData: z.array(z.any()).optional(),
  }),
  async execute({ questionScores, sentimentData }) {
    // Calculate weighted averages
    const totalWeight = questionScores.reduce((sum, q) => sum + q.weight, 0);
    
    const aggregated = questionScores.reduce((acc, q) => {
      return {
        communication: acc.communication + (q.scores.communication * q.weight),
        technical: acc.technical + (q.scores.technical * q.weight),
        problemSolving: acc.problemSolving + (q.scores.problemSolving * q.weight),
        confidence: acc.confidence + (q.scores.confidence * q.weight),
      };
    }, { communication: 0, technical: 0, problemSolving: 0, confidence: 0 });

    const baseScores = {
      communication: Math.round(aggregated.communication / totalWeight),
      technical: Math.round(aggregated.technical / totalWeight),
      problemSolving: Math.round(aggregated.problemSolving / totalWeight),
      confidence: Math.round(aggregated.confidence / totalWeight),
    };

    // Adjust confidence based on sentiment data if available
    if (sentimentData && sentimentData.length > 0) {
      const sentimentAdjustment = calculateSentimentAdjustment(sentimentData);
      baseScores.confidence = Math.round(
        baseScores.confidence * (1 + sentimentAdjustment)
      );
    }

    // Calculate overall score (weighted average)
    const overall = Math.round(
      baseScores.communication * 0.2 +
      baseScores.technical * 0.4 +
      baseScores.problemSolving * 0.3 +
      baseScores.confidence * 0.1
    );

    return {
      ...baseScores,
      overall,
    };
  },
});

const generateFeedbackTool = tool({
  name: 'generate_feedback',
  description: 'Generate detailed feedback and recommendations',
  parameters: z.object({
    scores: z.object({
      communication: z.number(),
      technical: z.number(),
      problemSolving: z.number(),
      confidence: z.number(),
      overall: z.number(),
    }),
    strongAnswers: z.array(z.string()),
    weakAnswers: z.array(z.string()),
    experienceLevel: z.string(),
  }),
  async execute({ scores, strongAnswers, weakAnswers, experienceLevel }) {
    const strengths = identifyStrengths(scores, strongAnswers);
    const weaknesses = identifyWeaknesses(scores, weakAnswers);
    const recommendations = generateRecommendations(scores, experienceLevel);

    return {
      strengths,
      weaknesses,
      recommendations,
      summary: generateSummary(scores, experienceLevel),
      hiringRecommendation: generateHiringRecommendation(scores, experienceLevel),
    };
  },
});

const identifyPatternsFromSentimentTool = tool({
  name: 'identify_patterns_from_sentiment',
  description: 'Identify behavioral patterns from sentiment data',
  parameters: z.object({
    sentimentData: z.array(z.any()),
    cheatingFlags: z.array(z.any()).optional(),
  }),
  async execute({ sentimentData, cheatingFlags }) {
    const patterns = {
      confidenceTrend: analyzeConfidenceTrend(sentimentData),
      stressPoints: identifyStressPoints(sentimentData),
      recoveryAbility: assessRecoveryFromDifficulty(sentimentData),
      consistencyScore: calculateConsistencyScore(sentimentData),
    };

    const behavioralInsights = {
      handlesPressureWell: patterns.stressPoints.length < 3 && patterns.recoveryAbility > 0.7,
      maintainsComposure: patterns.consistencyScore > 0.8,
      showsGrowthDuringInterview: patterns.confidenceTrend === 'increasing',
    };

    return {
      patterns,
      behavioralInsights,
      flags: cheatingFlags || [],
    };
  },
});

// Helper functions
function getEvaluationCriteria(type: string, difficulty: string): string[] {
  const baseCriteria = ['clarity', 'completeness', 'accuracy'];
  
  const typeCriteria: Record<string, string[]> = {
    BEHAVIORAL: ['specific examples', 'self-reflection', 'impact description'],
    TECHNICAL: ['conceptual understanding', 'practical application', 'best practices'],
    CODING: ['algorithm efficiency', 'code quality', 'edge case handling'],
  };

  const difficultyCriteria: Record<string, string[]> = {
    HIGH: ['nuanced understanding', 'innovative thinking', 'system-level perspective'],
    MEDIUM: ['solid reasoning', 'multiple approaches', 'trade-off analysis'],
    LOW: ['fundamental knowledge', 'basic application', 'clear communication'],
  };

  return [
    ...baseCriteria,
    ...(typeCriteria[type] || []),
    ...(difficultyCriteria[difficulty] || []),
  ];
}

function checkAnswerStructure(answer: string, type: string): boolean {
  if (type === 'BEHAVIORAL') {
    // Check for STAR method indicators
    return /situation|task|action|result|challenge|approach|outcome/i.test(answer);
  } else if (type === 'TECHNICAL') {
    // Check for structured explanation
    return /first|second|finally|because|therefore|however/i.test(answer);
  }
  return answer.split(/[.!?]/).length > 2; // Multiple sentences
}

function checkTopicCoverage(answer: string, expectedTopics: string[]): number {
  const answerLower = answer.toLowerCase();
  const coveredTopics = expectedTopics.filter(topic => 
    answerLower.includes(topic.toLowerCase())
  );
  return coveredTopics.length / expectedTopics.length;
}

function checkDepthOfKnowledge(answer: string): boolean {
  const depthIndicators = [
    /trade-?off/i,
    /depends on/i,
    /in my experience/i,
    /considering/i,
    /alternative/i,
    /optimize/i,
    /scale/i,
  ];
  return depthIndicators.some(pattern => pattern.test(answer));
}

function checkPracticalExamples(answer: string): boolean {
  const practicalIndicators = [
    /for example/i,
    /in practice/i,
    /I have/i,
    /we implemented/i,
    /real-world/i,
    /project/i,
  ];
  return practicalIndicators.some(pattern => pattern.test(answer));
}

function calculateQuestionScore(indicators: any, difficulty: string): number {
  let baseScore = 60; // Start with passing grade
  
  if (indicators.hasStructure) baseScore += 10;
  if (indicators.demonstratesDepth) baseScore += 15;
  if (indicators.showsPracticalUnderstanding) baseScore += 10;
  
  if (indicators.coversExpectedTopics !== null) {
    baseScore += Math.round(indicators.coversExpectedTopics * 15);
  }

  // Difficulty adjustment
  const difficultyMultiplier = {
    HIGH: 1.1,
    MEDIUM: 1.0,
    LOW: 0.9,
  };

  return Math.min(100, Math.round(baseScore * (difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1)));
}

function calculateSentimentAdjustment(sentimentData: SentimentData[]): number {
  // Average confidence from audio sentiment
  const audioConfidence = sentimentData
    .filter(d => d.audioSentiment)
    .map(d => d.audioSentiment!.confidence)
    .reduce((a, b, _, arr) => a + b / arr.length, 0);

  // Adjustment between -0.1 and +0.1
  return (audioConfidence - 0.5) * 0.2;
}

function identifyStrengths(scores: Score, strongAnswers: string[]): string[] {
  const strengths = [];
  
  if (scores.communication >= 80) strengths.push('Excellent communication skills');
  if (scores.technical >= 80) strengths.push('Strong technical knowledge');
  if (scores.problemSolving >= 80) strengths.push('Outstanding problem-solving ability');
  if (scores.confidence >= 80) strengths.push('High confidence and professional presence');
  
  // Add specific strengths from strong answers
  if (strongAnswers.length > 0) {
    strengths.push('Particularly strong in: ' + strongAnswers.slice(0, 3).join(', '));
  }
  
  return strengths;
}

function identifyWeaknesses(scores: Score, weakAnswers: string[]): string[] {
  const weaknesses = [];
  
  if (scores.communication < 60) weaknesses.push('Communication needs improvement');
  if (scores.technical < 60) weaknesses.push('Technical knowledge gaps identified');
  if (scores.problemSolving < 60) weaknesses.push('Problem-solving approach needs development');
  if (scores.confidence < 60) weaknesses.push('Could benefit from confidence building');
  
  // Add specific areas from weak answers
  if (weakAnswers.length > 0) {
    weaknesses.push('Areas for improvement: ' + weakAnswers.slice(0, 3).join(', '));
  }
  
  return weaknesses;
}

function generateRecommendations(scores: Score, experienceLevel: string): string[] {
  const recommendations = [];
  
  // Technical recommendations
  if (scores.technical < 70) {
    recommendations.push('Consider additional technical training or certifications');
  }
  
  // Communication recommendations
  if (scores.communication < 70) {
    recommendations.push('Practice explaining technical concepts to non-technical audiences');
  }
  
  // Experience-based recommendations
  if (experienceLevel === 'junior' && scores.overall >= 70) {
    recommendations.push('Strong potential for growth with mentorship');
  }
  
  return recommendations;
}

function generateSummary(scores: Score, experienceLevel: string): string {
  const performance = scores.overall >= 80 ? 'excellent' :
                     scores.overall >= 70 ? 'good' :
                     scores.overall >= 60 ? 'satisfactory' : 'below expectations';
  
  return `The candidate demonstrated ${performance} overall performance ` +
         `with particular strength in ${getStrongestArea(scores)}. ` +
         `For a ${experienceLevel}-level position, the candidate ` +
         `${scores.overall >= 70 ? 'meets or exceeds' : 'falls short of'} expectations.`;
}

function generateHiringRecommendation(scores: Score, experienceLevel: string): string {
  if (scores.overall >= 80) {
    return 'STRONG HIRE - Exceeds requirements';
  } else if (scores.overall >= 70) {
    return 'HIRE - Meets requirements well';
  } else if (scores.overall >= 60 && experienceLevel === 'junior') {
    return 'CONSIDER - Shows potential with proper support';
  } else {
    return 'NO HIRE - Does not meet current requirements';
  }
}

function getStrongestArea(scores: Score): string {
  const areas = {
    communication: scores.communication,
    technical: scores.technical,
    problemSolving: scores.problemSolving,
    confidence: scores.confidence,
  };
  
  return Object.entries(areas)
    .sort(([, a], [, b]) => b - a)[0][0]
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase();
}

function analyzeConfidenceTrend(sentimentData: SentimentData[]): 'increasing' | 'decreasing' | 'stable' {
  if (sentimentData.length < 3) return 'stable';
  
  const confidenceValues = sentimentData
    .filter(d => d.audioSentiment)
    .map(d => d.audioSentiment!.confidence);
  
  const firstHalf = confidenceValues.slice(0, Math.floor(confidenceValues.length / 2));
  const secondHalf = confidenceValues.slice(Math.floor(confidenceValues.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg + 0.1) return 'increasing';
  if (secondAvg < firstAvg - 0.1) return 'decreasing';
  return 'stable';
}

function identifyStressPoints(sentimentData: SentimentData[]): string[] {
  return sentimentData
    .filter(d => d.audioSentiment?.tone === 'STRESSED' || d.audioSentiment?.tone === 'NERVOUS')
    .map(d => d.timestamp);
}

function assessRecoveryFromDifficulty(sentimentData: SentimentData[]): number {
  // Simplified recovery assessment
  return 0.75; // Placeholder
}

function calculateConsistencyScore(sentimentData: SentimentData[]): number {
  // Simplified consistency calculation
  return 0.85; // Placeholder
}

export const scoringAgent = new Agent({
  name: 'scoring_agent',
  instructions: `You are an expert interview evaluator responsible for fair and comprehensive assessment. Your role is to:

1. Evaluate candidate responses objectively and consistently
2. Generate detailed scores across multiple dimensions
3. Provide constructive feedback and insights
4. Identify strengths and areas for improvement
5. Make data-driven recommendations

Scoring Dimensions:
1. COMMUNICATION (0-100):
   - Clarity of expression
   - Structure of thoughts
   - Active listening
   - Professional vocabulary
   - Ability to explain complex concepts

2. TECHNICAL (0-100):
   - Accuracy of knowledge
   - Depth of understanding
   - Practical application ability
   - Problem-solving approach
   - Awareness of best practices

3. PROBLEM SOLVING (0-100):
   - Analytical thinking
   - Approach to unknown problems
   - Creativity in solutions
   - Consideration of trade-offs
   - Debugging and optimization skills

4. CONFIDENCE (0-100):
   - Self-assurance in responses
   - Handling of difficult questions
   - Admission of knowledge gaps
   - Recovery from mistakes
   - Overall presence

Evaluation Guidelines:
- 90-100: Exceptional, exceeds expectations significantly
- 80-89: Excellent, exceeds expectations
- 70-79: Good, meets expectations well
- 60-69: Satisfactory, meets basic expectations
- 50-59: Below expectations, needs improvement
- 0-49: Significantly below expectations

Consider:
- Candidate's experience level (adjust expectations accordingly)
- Quality over quantity in responses
- Problem-solving process over just correct answers
- Growth potential and learning ability
- Cultural add and team fit indicators

For each evaluation:
1. Provide specific examples from responses
2. Note particularly strong or weak areas
3. Suggest areas for development
4. Consider trajectory and potential
5. Make fair comparisons to role requirements

Remember: This scoring is NEVER shared with candidates directly.`,
  tools: [
    evaluateResponseTool,
    calculateOverallScoreTool,
    generateFeedbackTool,
    identifyPatternsFromSentimentTool,
  ],
});