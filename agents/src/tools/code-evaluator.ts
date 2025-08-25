import { tool } from '@openai/agents'
import { z } from 'zod'
import { config } from '../config'

// Language ID mapping for Judge0
const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  typescript: 74,
  go: 60,
  rust: 73,
  ruby: 72,
  php: 68,
};

export const runCodeTool = tool({
  name: 'run_code',
  description: 'Execute code in a sandboxed environment and run test cases',
  parameters: z.object({
    code: z.string().describe('The code to execute'),
    language: z.enum(['javascript', 'python', 'java', 'cpp', 'c', 'typescript', 'go', 'rust', 'ruby', 'php']),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string(),
      isHidden: z.boolean().default(false),
    })),
    timeLimit: z.number().default(5).describe('Time limit in seconds'),
    memoryLimit: z.number().default(128).describe('Memory limit in MB'),
  }),
  execute: async ({ code, language, testCases, timeLimit, memoryLimit }: { code: string; language: keyof typeof LANGUAGE_IDS; testCases: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>; timeLimit: number; memoryLimit: number }) => {
    const results = [];
    const languageId = LANGUAGE_IDS[language]

    for (const testCase of testCases) {
      try {
        // Submit code to Judge0
        const submission = await fetch(`${config.judge0.apiUrl}/submissions?base64_encoded=false&wait=true`, {
          method: 'POST',
          headers: {
            'X-RapidAPI-Key': config.judge0.apiKey,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_code: code,
            language_id: languageId,
            stdin: testCase.input,
            expected_output: testCase.expectedOutput,
            cpu_time_limit: timeLimit,
            memory_limit: memoryLimit * 1024,
          }),
        })
        const result = await submission.json()
        
        results.push({
          passed: result.status.id === 3, // Accepted
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: result.stdout || result.stderr || '',
          executionTime: result.time ? parseFloat(result.time) : null,
          memory: result.memory || null,
          status: result.status.description,
          isHidden: testCase.isHidden,
        })
      } catch (error) {
        results.push({
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: 'Error running test case',
          executionTime: null,
          memory: null,
          status: 'Runtime Error',
          isHidden: testCase.isHidden,
        })
      }
    }

    const visibleResults = results.filter(r => !r.isHidden);
    const allPassed = results.every(r => r.passed);
    const passedCount = results.filter(r => r.passed).length;

    return {
      success: allPassed,
      passedTests: passedCount,
      totalTests: results.length,
      visibleResults,
      summary: `Passed ${passedCount}/${results.length} test cases`,
    }
  },
})

export const analyzeCodeQualityTool = tool({
  name: 'analyze_code_quality',
  description: 'Analyze code for quality, style, and best practices',
  parameters: z.object({
    code: z.string(),
    language: z.string(),
    problemContext: z.string().optional(),
  }),
  execute: async ({ code, language, problemContext }: { code: string; language: string; problemContext?: string }) => {
    // Basic code quality checks
    const analysis = {
      hasComments: /\/\/|\/\*|\#/.test(code),
      hasDescriptiveNames: checkDescriptiveNames(code),
      hasErrorHandling: checkErrorHandling(code, language),
      hasEdgeCases: checkEdgeCases(code),
      complexity: estimateComplexity(code),
      lineCount: code.split('\n').length,
      suggestions: [] as string[],
    };

    // Language-specific checks
    if (language === 'javascript' || language === 'typescript') {
      if (!analysis.hasErrorHandling && !code.includes('try')) {
        analysis.suggestions.push('Consider adding error handling with try-catch blocks');
      }
      if (code.includes('var ')) {
        analysis.suggestions.push('Use const/let instead of var for better scoping');
      }
    }

    if (language === 'python') {
      if (!code.includes('def ') && !code.includes('class ')) {
        analysis.suggestions.push('Consider organizing code into functions or classes');
      }
      if (!analysis.hasComments && !code.includes('"""')) {
        analysis.suggestions.push('Add docstrings to document your functions');
      }
    }

    // General suggestions
    if (!analysis.hasComments) {
      analysis.suggestions.push('Add comments to explain complex logic');
    }
    if (analysis.complexity === 'high') {
      analysis.suggestions.push('Consider breaking down complex functions into smaller ones');
    }
    if (!analysis.hasEdgeCases) {
      analysis.suggestions.push('Consider handling edge cases (empty inputs, null values, etc.)');
    }

    return {
      quality: calculateQualityScore(analysis),
      analysis,
      feedback: generateQualityFeedback(analysis),
    }
  },
})

// Helper functions
function checkDescriptiveNames(code: string): boolean {
  // Check for single-letter variables (except common ones like i, j for loops)
  const badNames = code.match(/\b[a-z]\b(?![\s]*[=<>])/g) || [];
  const allowedSingleLetters = ['i', 'j', 'k', 'x', 'y', 'n', 'm'];
  const problematicNames = badNames.filter(name => !allowedSingleLetters.includes(name));
  return problematicNames.length < 3;
}

function checkErrorHandling(code: string, language: string): boolean {
  const errorPatterns: Record<string, RegExp[]> = {
    javascript: [/try\s*{/, /catch\s*\(/, /\.catch\(/, /if\s*\(\s*error\s*\)/],
    typescript: [/try\s*{/, /catch\s*\(/, /\.catch\(/, /if\s*\(\s*error\s*\)/],
    python: [/try\s*:/, /except\s*/, /if\s+.*is\s+None/],
    java: [/try\s*{/, /catch\s*\(/, /throws\s+\w+Exception/],
    cpp: [/try\s*{/, /catch\s*\(/],
  };

  const patterns = errorPatterns[language] || [];
  return patterns.some(pattern => pattern.test(code));
}

function checkEdgeCases(code: string): boolean {
  const edgeCasePatterns = [
    /if\s*\(\s*\w+\.length\s*===?\s*0\s*\)/,
    /if\s*\(\s*!\w+\s*\)/,
    /if\s*\(\s*\w+\s*===?\s*null\s*\)/,
    /if\s*\(\s*len\(\w+\)\s*==\s*0\s*\)/,
    /if\s+not\s+\w+/,
    /\w+\s*\?\./,
  ];
  
  return edgeCasePatterns.some(pattern => pattern.test(code));
}

function estimateComplexity(code: string): 'low' | 'medium' | 'high' {
  const lines = code.split('\n').length;
  const loops = (code.match(/for\s*\(|while\s*\(|for\s+\w+\s+in|while\s+/g) || []).length;
  const conditions = (code.match(/if\s*\(|if\s+/g) || []).length;
  const functions = (code.match(/function\s+\w+|def\s+\w+|=>\s*{/g) || []).length;

  const complexityScore = loops * 3 + conditions * 2 + (lines / 10);

  if (complexityScore > 20) return 'high';
  if (complexityScore > 10) return 'medium';
  return 'low';
}

function calculateQualityScore(analysis: any): number {
  let score = 50; // Base score

  if (analysis.hasComments) score += 10;
  if (analysis.hasDescriptiveNames) score += 15;
  if (analysis.hasErrorHandling) score += 15;
  if (analysis.hasEdgeCases) score += 10;

  if (analysis.complexity === 'low') score += 5;
  if (analysis.complexity === 'high') score -= 5;

  return Math.min(100, Math.max(0, score));
}

function generateQualityFeedback(analysis: any): string {
  const score = calculateQualityScore(analysis);
  
  if (score >= 80) {
    return 'Excellent code quality! Well-structured with good practices.';
  } else if (score >= 60) {
    return 'Good code quality with room for improvement in some areas.';
  } else if (score >= 40) {
    return 'Fair code quality. Consider implementing the suggestions to improve.';
  } else {
    return 'Code needs improvement. Focus on the suggested areas.';
  }
}
