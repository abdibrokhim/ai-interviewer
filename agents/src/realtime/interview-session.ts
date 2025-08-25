import { RealtimeAgent, RealtimeSession, tool } from '@openai/agents/realtime'
import { z } from 'zod';
import { InterviewContext, SentimentData } from '../types';
import { interviewConductorAgent } from '../agents/interview-conductor';
import { analyzeFacialSentimentTool, analyzeAudioSentimentTool, detectCheatingBehaviorTool } from '../tools/sentiment-analyzer';

// Custom realtime agent for interviews
export class InterviewRealtimeAgent extends RealtimeAgent {
  private interviewContext: InterviewContext;
  private sessionData: {
    startTime: Date;
    tabSwitches: number;
    sentimentHistory: SentimentData[];
    currentQuestionIndex: number;
    transcript: string[];
    cheatingFlags: any[];
  };

  constructor(context: InterviewContext) {
    super({
      name: 'realtime_interview_agent',
      instructions: `You are a professional AI interviewer conducting a live technical interview. 

Your personality:
- Warm and welcoming, but professional
- Patient and encouraging
- Clear in communication
- Adaptive to candidate's pace

Interview guidelines:
- Start with a friendly introduction
- Explain the interview structure
- Ask questions clearly and allow time for answers
- Provide appropriate encouragement
- Never reveal scores or evaluation criteria
- Maintain focus on the interview topics
- Handle technical issues gracefully

Voice characteristics:
- Speak at a moderate pace
- Use clear pronunciation
- Pause appropriately for candidate responses
- Sound engaged and interested

Remember: This is a professional interview. Be supportive but maintain assessment integrity.`,
      tools: [
        checkTimeRemainingTool,
        markQuestionCompleteTool,
        flagSuspiciousBehaviorTool,
      ],
    });

    this.interviewContext = context;
    this.sessionData = {
      startTime: new Date(),
      tabSwitches: 0,
      sentimentHistory: [],
      currentQuestionIndex: 0,
      transcript: [],
      cheatingFlags: [],
    };
  }

  async handleInterviewStart(session: RealtimeSession) {
    // Initial greeting
    const greeting = `Hello ${this.interviewContext.candidateName}, welcome to your interview with ${this.getCompanyName()}. 
    I'm your AI interviewer today, and I'll be conducting this ${this.interviewContext.duration}-minute ${this.interviewContext.interviewType.toLowerCase()} interview. 
    
    Before we begin, let me explain how this will work:
    - I'll ask you ${this.interviewContext.questions.length} questions
    - Take your time to think through each answer
    - Feel free to ask for clarification if needed
    - I'll be taking notes throughout our conversation
    
    Are you ready to begin?`;

    await session.sendMessage(greeting);
  }

  async handleCandidateResponse(
    session: RealtimeSession,
    response: string,
    audioFeatures?: any
  ) {
    // Add to transcript
    this.sessionData.transcript.push(`Candidate: ${response}`);

    // Analyze sentiment if audio features available
    if (audioFeatures) {
      const sentimentData = await this.analyzeSentiment(audioFeatures);
      this.sessionData.sentimentHistory.push(sentimentData);
    }

    // Process response based on current state
    if (this.isWaitingForAnswer()) {
      await this.processAnswer(session, response);
    }
  }

  async processAnswer(session: RealtimeSession, answer: string) {
    const currentQuestion = this.interviewContext.questions[this.sessionData.currentQuestionIndex];
    
    // Store the answer
    await this.storeQuestionAnswer(currentQuestion.id, answer);

    // Determine if follow-up is needed
    const timeRemaining = this.getTimeRemaining();
    const shouldAskFollowUp = await this.shouldAskFollowUp(answer, timeRemaining);

    if (shouldAskFollowUp) {
      const followUp = await this.generateFollowUp(currentQuestion, answer);
      this.sessionData.transcript.push(`Interviewer: ${followUp}`);
      await session.sendMessage(followUp);
    } else {
      // Move to next question
      await this.transitionToNextQuestion(session);
    }
  }

  async transitionToNextQuestion(session: RealtimeSession) {
    this.sessionData.currentQuestionIndex++;

    if (this.sessionData.currentQuestionIndex >= this.interviewContext.questions.length) {
      await this.concludeInterview(session);
      return;
    }

    const transition = this.getTransitionPhrase();
    const nextQuestion = this.interviewContext.questions[this.sessionData.currentQuestionIndex];

    const message = `${transition} ${nextQuestion.text}`;
    this.sessionData.transcript.push(`Interviewer: ${message}`);
    await session.sendMessage(message);
  }

  async concludeInterview(session: RealtimeSession) {
    const conclusion = `That brings us to the end of our interview. Thank you so much for your time and thoughtful responses, ${this.interviewContext.candidateName}. 
    
    The next steps are:
    - Your interview will be reviewed by the hiring team
    - You'll receive feedback within the timeframe communicated by the recruiter
    - If you have any questions about the process, please reach out to your point of contact
    
    Do you have any final questions for me before we end?`;

    this.sessionData.transcript.push(`Interviewer: ${conclusion}`);
    await session.sendMessage(conclusion);

    // Prepare final results
    await this.prepareInterviewResults();
  }

  // Helper methods
  private getCompanyName(): string {
    // This would be fetched from company data
    return 'the company';
  }

  private getTimeRemaining(): number {
    const elapsed = (Date.now() - this.sessionData.startTime.getTime()) / 1000 / 60;
    return Math.max(0, this.interviewContext.duration - elapsed);
  }

  private isWaitingForAnswer(): boolean {
    // Check if we're in a state waiting for an answer
    return this.sessionData.currentQuestionIndex < this.interviewContext.questions.length;
  }

  private isAskingForClarification(response: string): boolean {
    const clarificationPatterns = [
      /can you (explain|clarify|repeat)/i,
      /what do you mean/i,
      /i don't understand/i,
      /could you rephrase/i,
      /sorry.*didn't catch/i,
    ];
    return clarificationPatterns.some(pattern => pattern.test(response));
  }

  private async analyzeSentiment(audioFeatures: any): Promise<SentimentData> {
    const result = await (analyzeAudioSentimentTool as any).execute({
      audioFeatures,
      timestamp: new Date().toISOString(),
    }) as any
    return result as SentimentData;
  }

  private async shouldAskFollowUp(answer: string, timeRemaining: number): Promise<boolean> {
    // Don't ask follow-ups if running out of time
    if (timeRemaining < 5) return false;

    const currentQuestion = this.interviewContext.questions[this.sessionData.currentQuestionIndex];
    
    // Ask follow-up for HIGH depth questions or incomplete answers
    return currentQuestion.difficulty === 'HIGH' && answer.length < 100;
  }

  private async generateFollowUp(question: any, answer: string): Promise<string> {
    // This would use the question generator agent
    return "That's interesting. Can you elaborate on your approach and why you chose it?";
  }

  private getTransitionPhrase(): string {
    const phrases = [
      "Great, thank you for that answer. Let's move on to the next question.",
      "I appreciate your response. Now, I'd like to ask you about something else.",
      "Thank you. For our next topic,",
      "Excellent. Moving forward,",
      "That's helpful. Let me ask you another question:",
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  private async storeQuestionAnswer(questionId: string, answer: string) {
    // Store in database or session storage
  }

  private async prepareInterviewResults() {
    // Compile all results for scoring
    const results = {
      interviewId: this.interviewContext.interviewId,
      transcript: this.sessionData.transcript.join('\n'),
      sentimentHistory: this.sessionData.sentimentHistory,
      cheatingFlags: this.sessionData.cheatingFlags,
      duration: (Date.now() - this.sessionData.startTime.getTime()) / 1000 / 60,
      questionsAnswered: this.sessionData.currentQuestionIndex,
    };

    // Hand off to scoring agent
    await this.handoffToScoring(results);
  }

  private async handoffToScoring(results: any) {
    // Implement handoff to scoring agent
  }

  // Event handlers for cheating detection
  async handleTabSwitch() {
    this.sessionData.tabSwitches++;
    
    if (this.sessionData.tabSwitches > 2) {
      this.sessionData.cheatingFlags.push({
        type: 'TAB_SWITCH',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        description: `Excessive tab switching (${this.sessionData.tabSwitches} times)`,
      });
    }
  }

  async handleMultipleFaces(faceCount: number) {
    if (faceCount > 1) {
      this.sessionData.cheatingFlags.push({
        type: 'MULTIPLE_FACES',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        description: `${faceCount} faces detected`,
      });
    }
  }
}

// Tools for the realtime agent
const checkTimeRemainingTool = tool({
  name: 'check_time_remaining',
  description: 'Check how much time is left in the interview',
  parameters: z.object({}),
  execute: async () => {
    // Access context to get session data
    return {
      timeRemaining: 0, // Would be calculated from session
      shouldHurry: false,
    };
  },
});

const markQuestionCompleteTool = tool({
  name: 'mark_question_complete',
  description: 'Mark current question as answered',
  parameters: z.object({
    questionId: z.string(),
    answerQuality: z.enum(['incomplete', 'basic', 'good', 'excellent']),
  }),
  execute: async ({ questionId, answerQuality }: { questionId: string; answerQuality: 'incomplete' | 'basic' | 'good' | 'excellent' }) => {
    return {
      marked: true,
      questionId,
      quality: answerQuality,
    };
  },
});

const flagSuspiciousBehaviorTool = tool({
  name: 'flag_suspicious_behavior',
  description: 'Flag potentially suspicious behavior during interview',
  parameters: z.object({
    type: z.enum(['OFF_TOPIC', 'COACHING_SUSPECTED', 'UNUSUAL_PAUSE', 'COPY_PASTE']),
    description: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  }),
  execute: async ({ type, description, severity }: { type: 'OFF_TOPIC' | 'COACHING_SUSPECTED' | 'UNUSUAL_PAUSE' | 'COPY_PASTE'; description: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }) => {
    return {
      flagged: true,
      type,
      severity,
      timestamp: new Date().toISOString(),
    };
  },
});

// Session manager
export class InterviewSessionManager {
  private agent: InterviewRealtimeAgent;
  private session: RealtimeSession;
  private mediaHandlers: {
    onVideoFrame?: (frame: any) => void;
    onAudioData?: (data: any) => void;
  };

  constructor(context: InterviewContext) {
    this.agent = new InterviewRealtimeAgent(context);
    this.session = new RealtimeSession(this.agent);
    this.mediaHandlers = {};
  }

  async connect(options: {
    apiKey: string;
    onVideoFrame?: (frame: any) => void;
    onAudioData?: (data: any) => void;
  }) {
    this.mediaHandlers = {
      onVideoFrame: options.onVideoFrame,
      onAudioData: options.onAudioData,
    };

    await this.session.connect({
      apiKey: options.apiKey,
      model: 'gpt-4-realtime',
    });

    // Start the interview
    await this.agent.handleInterviewStart(this.session);
  }

  async handleTabVisibilityChange(isVisible: boolean) {
    if (!isVisible) {
      await this.agent.handleTabSwitch();
    }
  }

  async handleVideoFrame(frame: any) {
    if (this.mediaHandlers.onVideoFrame) {
      this.mediaHandlers.onVideoFrame(frame);
    }

    // Analyze frame for cheating detection
    // This would use face detection
  }

  async handleAudioData(data: any) {
    if (this.mediaHandlers.onAudioData) {
      this.mediaHandlers.onAudioData(data);
    }

    // Extract audio features for sentiment analysis
  }

  async disconnect() {
    // RealtimeSession currently doesn't expose disconnect; close transport via end of page/session
  }
}

// Example usage
export async function createInterviewSession(
  context: InterviewContext,
  apiKey: string
): Promise<InterviewSessionManager> {
  const manager = new InterviewSessionManager(context);
  
  await manager.connect({
    apiKey,
    onVideoFrame: async (frame) => {
      // Process video frame for face detection
    },
    onAudioData: async (data) => {
      // Process audio for sentiment analysis
    },
  });

  return manager;
}
