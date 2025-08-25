import { Agent, handoff } from '@openai/agents';
import { runCodeTool, analyzeCodeQualityTool } from '../tools/code-evaluator';
import { z } from 'zod';
import { CodeProblem } from '../types';
import { scoringAgent } from './scoring-agent';

export const codeEvaluatorAgent = new Agent({
  name: 'code_evaluator',
  instructions: `You are an expert code evaluator and technical interviewer. Your role is to:

1. Present coding problems clearly and effectively
2. Evaluate code solutions for correctness and quality
3. Assess problem-solving approach and coding skills
4. Provide constructive feedback on code
5. Run test cases and analyze results

When presenting problems:
- State the problem clearly with examples
- Clarify inputs, outputs, and constraints
- Allow time for questions and clarification
- Don't provide hints unless candidate is completely stuck
- Focus on problem-solving process over syntax

Evaluation criteria:
1. CORRECTNESS (40%):
   - Passes all test cases
   - Handles edge cases
   - Produces expected output

2. EFFICIENCY (25%):
   - Time complexity analysis
   - Space complexity analysis
   - Optimization choices

3. CODE QUALITY (20%):
   - Readability and clarity
   - Proper naming conventions
   - Code organization
   - Comments where necessary

4. PROBLEM SOLVING (15%):
   - Understanding requirements
   - Asking clarifying questions
   - Breaking down the problem
   - Testing approach

For each solution:
- Run all visible and hidden test cases
- Analyze time and space complexity
- Check for common pitfalls
- Evaluate code style and best practices
- Note the problem-solving approach

Provide feedback that:
- Acknowledges what was done well
- Points out specific issues
- Suggests improvements
- Focuses on learning opportunities
- Remains constructive and professional

Remember: Syntax errors are less important than logic and approach, especially in interview settings.`,
  tools: [runCodeTool, analyzeCodeQualityTool],
});

// Present a coding problem
export async function presentCodingProblem(
  agent: Agent,
  problem: CodeProblem
): Promise<string> {
  const presentation = `
Here's your coding problem:

**${problem.title}**

${problem.description}

**Examples:**
${problem.examples.map((ex, i) => `
Example ${i + 1}:
Input: ${ex.input}
Output: ${ex.output}
${ex.explanation ? `Explanation: ${ex.explanation}` : ''}
`).join('\n')}

**Constraints:**
${problem.constraints.map(c => `- ${c}`).join('\n')}

${problem.timeLimit ? `Time Limit: ${problem.timeLimit} seconds per test case` : ''}
${problem.memoryLimit ? `Memory Limit: ${problem.memoryLimit} MB` : ''}

Please implement your solution. Let me know if you need any clarification!
`;

  return presentation;
}

// Evaluate submitted code
export async function evaluateCodeSubmission(
  agent: Agent,
  context: {
    problem: CodeProblem;
    code: string;
    language: string;
    timeSpent: number;
  }
): Promise<{
  passed: boolean;
  score: number;
  feedback: string;
  testResults: any[];
  complexity: { time: string; space: string };
}> {
  const { problem, code, language, timeSpent } = context;

  // Run test cases
  const testResults = await (runCodeTool as any).execute({
    code,
    language: language as any,
    testCases: problem.testCases,
    timeLimit: problem.timeLimit || 5,
    memoryLimit: problem.memoryLimit || 128,
  });

  // Analyze code quality
  const qualityAnalysis = await (analyzeCodeQualityTool as any).execute({
    code,
    language,
    problemContext: problem.description,
  });

  // Calculate complexity (this would typically be done by the agent)
  const complexity = analyzeComplexity(code, problem);

  // Calculate overall score
  const score = calculateCodeScore({
    testResults,
    qualityAnalysis,
    complexity,
    timeSpent,
    expectedTime: problem.difficulty === 'EASY' ? 15 : problem.difficulty === 'MEDIUM' ? 25 : 40,
  });

  // Generate feedback
  const feedback = generateCodeFeedback({
    problem,
    testResults,
    qualityAnalysis,
    complexity,
    score,
  });

  return {
    passed: testResults.success,
    score,
    feedback,
    testResults: testResults.visibleResults,
    complexity,
  };
}

// Helper functions
function analyzeComplexity(code: string, problem: CodeProblem): { time: string; space: string } {
  // Simplified complexity analysis
  // In practice, this would be done by the agent using LLM
  
  const hasNestedLoops = /for.*{[\s\S]*?for.*{/i.test(code) || 
                        /while.*{[\s\S]*?while.*{/i.test(code);
  const hasRecursion =
    /\bfunction\s+([A-Za-z_]\w*)\s*\([\s\S]*?\)\s*\{[\s\S]*?\b\1\s*\(/.test(code) ||
    /\bconst\s+([A-Za-z_]\w*)\s*=\s*\([\s\S]*?\)\s*=>\s*\{[\s\S]*?\b\1\s*\(/.test(code);
  const hasHashMap = /Map|Set|Object|Dictionary|HashMap/i.test(code);
  const hasArray = /\[\]|Array|push|pop/i.test(code);

  let timeComplexity = 'O(1)';
  let spaceComplexity = 'O(1)';

  if (hasNestedLoops) {
    timeComplexity = 'O(n²)';
  } else if (code.match(/for|while/g)?.length === 1) {
    timeComplexity = 'O(n)';
  } else if (hasRecursion) {
    timeComplexity = 'O(n) to O(2ⁿ) depending on recursion';
  }

  if (hasHashMap || hasArray) {
    spaceComplexity = 'O(n)';
  }
  if (hasRecursion) {
    spaceComplexity = 'O(n) call stack';
  }

  return { time: timeComplexity, space: spaceComplexity };
}

function calculateCodeScore(params: {
  testResults: any;
  qualityAnalysis: any;
  complexity: { time: string; space: string };
  timeSpent: number;
  expectedTime: number;
}): number {
  const { testResults, qualityAnalysis, timeSpent, expectedTime } = params;

  let score = 0;

  // Correctness (40%)
  const correctnessScore = (testResults.passedTests / testResults.totalTests) * 40;
  score += correctnessScore;

  // Efficiency (25%)
  // This is simplified - would need problem-specific optimal complexity
  let efficiencyScore = 15; // Base score for working solution
  if (params.complexity.time.includes('n²') && expectedTime < 30) {
    efficiencyScore = 10; // Probably not optimal for most problems
  } else if (params.complexity.time === 'O(n)' || params.complexity.time === 'O(n log n)') {
    efficiencyScore = 20; // Good complexity
  }
  score += efficiencyScore;

  // Code Quality (20%)
  score += (qualityAnalysis.quality / 100) * 20;

  // Problem Solving (15%)
  // Time-based scoring
  const timeRatio = timeSpent / expectedTime;
  let problemSolvingScore = 10; // Base score
  if (timeRatio < 0.8) problemSolvingScore = 15; // Fast solver
  else if (timeRatio > 1.5) problemSolvingScore = 5; // Too slow
  score += problemSolvingScore;

  return Math.round(Math.min(100, score));
}

function generateCodeFeedback(params: {
  problem: CodeProblem;
  testResults: any;
  qualityAnalysis: any;
  complexity: { time: string; space: string };
  score: number;
}): string {
  const { testResults, qualityAnalysis, complexity, score } = params;

  let feedback = '';

  // Overall performance
  if (score >= 80) {
    feedback += 'Excellent solution! ';
  } else if (score >= 60) {
    feedback += 'Good attempt with room for improvement. ';
  } else {
    feedback += 'The solution needs work. ';
  }

  // Test results
  feedback += `\n\nTest Results: ${testResults.summary}\n`;
  if (!testResults.success) {
    feedback += 'Some test cases failed. Review edge cases and logic.\n';
  }

  // Complexity
  feedback += `\nComplexity Analysis:\n`;
  feedback += `- Time: ${complexity.time}\n`;
  feedback += `- Space: ${complexity.space}\n`;

  // Code quality
  feedback += `\nCode Quality: ${qualityAnalysis.feedback}\n`;
  if (qualityAnalysis.analysis.suggestions.length > 0) {
    feedback += 'Suggestions:\n';
    qualityAnalysis.analysis.suggestions.forEach((s: string) => {
      feedback += `- ${s}\n`;
    });
  }

  return feedback;
}

// Generate hints for stuck candidates
export async function generateHint(
  agent: Agent,
  context: {
    problem: CodeProblem;
    currentCode: string;
    stuckDuration: number;
    hintsGiven: number;
  }
): Promise<string> {
  const { problem, currentCode, stuckDuration, hintsGiven } = context;

  // Progressive hint system
  if (hintsGiven === 0 && stuckDuration > 5) {
    return 'Think about the problem step by step. What\'s the simplest case you need to handle?';
  } else if (hintsGiven === 1 && stuckDuration > 10) {
    return `Consider the constraints. ${problem.constraints[0]} might give you a clue about the approach.`;
  } else if (hintsGiven === 2 && stuckDuration > 15) {
    return 'What data structure could help you solve this efficiently?';
  }

  return 'Take your time. Would you like to talk through your approach?';
}

// Handoff back to scoring agent
export const handoffToScoringForCode = handoff(scoringAgent, {
  toolNameOverride: 'handoff_to_scoring_for_code',
  toolDescriptionOverride: 'Hand off code evaluation results to scoring agent',
  inputType: z.object({
    codeResults: z.array(z.object({
      problemId: z.string(),
      passed: z.boolean(),
      score: z.number(),
      feedback: z.string(),
      complexity: z.object({
        time: z.string(),
        space: z.string(),
      }),
    })),
  }),
});
