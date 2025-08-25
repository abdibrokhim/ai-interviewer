# AI Interview Agents

This module contains the AI agents that power the interview platform using OpenAI's Agents SDK.

## Architecture

The system consists of multiple specialized agents that work together:

### 1. Interview Conductor Agent
- Conducts live interviews with candidates
- Manages interview flow and timing
- Asks follow-up questions based on responses
- Enforces guardrails to prevent system information leakage

### 2. Resume Parser Agent
- Extracts structured information from resumes
- Identifies skills, experience, and education
- Searches for online presence (GitHub, LinkedIn)
- Provides candidate insights

### 3. Question Generator Agent
- Creates customized interview questions
- Adapts to job requirements and candidate background
- Supports multiple interview types (behavioral, technical, coding)
- Manages question difficulty and depth

### 4. Scoring Agent
- Evaluates candidate responses objectively
- Scores across multiple dimensions (communication, technical, problem-solving, confidence)
- Generates detailed feedback and recommendations
- Never reveals scores to candidates

### 5. Code Evaluator Agent
- Presents coding problems clearly
- Runs test cases using Judge0 API
- Analyzes code quality and efficiency
- Provides constructive feedback

## Guardrails

The system implements several guardrails to ensure interview integrity:

- **No System Information**: Prevents candidates from extracting implementation details
- **Stay On Topic**: Keeps interviews focused and professional
- **No Direct Answers**: Prevents giving away solutions or excessive hints
- **No Score Revelation**: Ensures evaluation data is never shared with candidates
- **Professional Tone**: Maintains appropriate interview atmosphere

## Real-time Interview Support

The system supports real-time interviews with:

- Voice interaction using OpenAI Realtime API
- Facial sentiment analysis for confidence assessment
- Cheating detection (tab switches, multiple faces)
- Live transcription and note-taking

## Usage

### Basic Interview Flow

```typescript
import { orchestrator } from '@ai-interviewer/agents';

// 1. Parse candidate resume
const resume = await orchestrator.parseResume(resumeText);

// 2. Generate interview questions
const questions = await orchestrator.generateQuestions({
  jobId: 'job-123',
  candidateResume: resume,
  interviewType: 'TECHNICAL',
  duration: 45,
  depth: 'MEDIUM',
});

// 3. Create interview session
const session = await orchestrator.runCompleteInterview({
  interviewId: 'interview-123',
  candidateId: 'candidate-123',
  candidateEmail: 'candidate@example.com',
  jobId: 'job-123',
  companyId: 'company-123',
});

// 4. Score completed interview
const results = await orchestrator.scoreInterview('interview-123');
```

### Real-time Interview

```typescript
import { createInterviewSession } from '@ai-interviewer/agents';

const session = await createInterviewSession(
  interviewContext,
  process.env.OPENAI_API_KEY
);

// Handle tab visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    session.handleTabVisibilityChange(false);
  }
});
```

## Configuration

Set up environment variables:

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_TRACING_API_KEY=sk-... # Optional, for production

# Google (for Gemini)
GEMINI_API_KEY=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE=...

# Judge0 (for code evaluation)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=...
```

## Sentiment Analysis

The system analyzes:

- **Audio Sentiment**: Pace, tone, confidence from speech
- **Facial Sentiment**: Emotions, eye contact, presence
- **Behavioral Patterns**: Stress points, recovery ability, consistency

## Scoring Dimensions

Candidates are evaluated on:

1. **Communication** (0-100)
   - Clarity of expression
   - Structure of thoughts
   - Professional vocabulary

2. **Technical** (0-100)
   - Accuracy of knowledge
   - Depth of understanding
   - Practical application

3. **Problem Solving** (0-100)
   - Analytical thinking
   - Creative solutions
   - Trade-off considerations

4. **Confidence** (0-100)
   - Self-assurance
   - Handling difficult questions
   - Overall presence

## Development

```bash
# Install dependencies
cd agents
npm install

# Run in development
npm run dev

# Build
npm run build

# Test
npm test
```

## Security Notes

- Never expose service role keys to the client
- All agent responses pass through guardrails
- Candidate cannot access scoring information
- Cheating detection flags are for employer review only
