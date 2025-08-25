import { defineOutputGuardrail, InputGuardrail } from '@openai/agents'
import { z } from 'zod'

// Input guardrail to prevent candidates from extracting system information
const preventSystemInfoExtractionAny: any = {
  name: 'prevent_system_info_extraction',
  async execute({ input }: any) {
    const bannedPatterns = [
      /what\s+(model|llm|ai|gpt|api)/i,
      /tell\s+me\s+about\s+(your|the)\s+(system|implementation|architecture)/i,
      /how\s+(are|do)\s+you\s+(built|implemented|work)/i,
      /what\s+(api|service|backend)/i,
      /reveal\s+(the|your)\s+(prompt|instructions|score|scoring)/i,
      /show\s+me\s+(the|my)\s+(score|result|feedback)/i,
      /what\s+is\s+my\s+(score|grade|rating)/i,
      /debug|developer\s+mode|system\s+prompt/i,
    ];

    const inputText = typeof input === 'string' ? input : JSON.stringify(input)
    
    for (const pattern of bannedPatterns) {
      if (pattern.test(inputText)) {
        return {
          safe: false,
          tripwireTriggered: true,
          severity: 'block',
          outputInfo: { reason: 'Attempted to extract system information' },
          modifiedInput: "Let's focus on the interview questions. Could you please answer the current question?",
        } as any
      }
    }

    return { safe: true, tripwireTriggered: false, severity: 'none', outputInfo: {} } as any
  },
};
export const preventSystemInfoExtraction = preventSystemInfoExtractionAny as InputGuardrail

// Input guardrail to keep conversation on topic
const keepOnTopicAny: any = {
  name: 'keep_on_topic',
  async execute({ input }: any) {

    const offTopicPatterns = [
      /tell\s+me\s+a\s+(joke|story)/i,
      /what\s+do\s+you\s+think\s+about\s+(politics|religion|sports)/i,
      /let\'s\s+talk\s+about\s+something\s+else/i,
      /change\s+the\s+(topic|subject)/i,
      /can\s+we\s+discuss/i,
      /forget\s+about\s+the\s+interview/i,
    ];

    const inputText = typeof input === 'string' ? input : JSON.stringify(input)
    
    for (const pattern of offTopicPatterns) {
      if (pattern.test(inputText)) {
        return {
          safe: false,
          tripwireTriggered: true,
          severity: 'block',
          outputInfo: { reason: 'Attempted to divert from interview' },
          modifiedInput: "I understand, but let's stay focused on the interview. Please answer the current question.",
        } as any
      }
    }

    return { safe: true, tripwireTriggered: false, severity: 'none', outputInfo: {} } as any
  },
};
export const keepOnTopic = keepOnTopicAny as InputGuardrail

// Input guardrail to prevent hint extraction
const preventHintExtractionAny: any = {
  name: 'prevent_hint_extraction',
  async execute({ input }: any) {
    const hintPatterns = [
      /give\s+me\s+(the\s+)?(answer|solution|hint|clue)/i,
      /what\'s\s+the\s+(answer|solution)/i,
      /tell\s+me\s+the\s+(answer|solution)/i,
      /can\s+you\s+(solve|answer)\s+(it|this)\s+for\s+me/i,
      /just\s+tell\s+me/i,
      /i\s+don\'t\s+know.*help/i,
    ];

    const inputText = typeof input === 'string' ? input : JSON.stringify(input)
    
    for (const pattern of hintPatterns) {
      if (pattern.test(inputText)) {
        return {
          safe: false,
          tripwireTriggered: true,
          severity: 'block',
          outputInfo: { reason: 'Attempted to extract hints or answers' },
          modifiedInput: "I can guide you through the problem, but I cannot provide direct answers. Let me ask you: what approach would you consider for this problem?",
        } as any
      }
    }

    return { safe: true, tripwireTriggered: false, severity: 'none', outputInfo: {} } as any
  },
};
export const preventHintExtraction = preventHintExtractionAny as InputGuardrail

// Output guardrail to ensure no scoring information is revealed
export const preventScoringInfoLeak = defineOutputGuardrail({
  name: 'prevent_scoring_leak',
  inputSchema: z.object({
    output: z.string(),
  }),
  async execute(args: any) {
    const text: string = args?.text ?? args?.output ?? ''
    const scoringPatterns = [
      /your?\s+score\s+(is|was)/i,
      /you\s+(scored|got|achieved)/i,
      /\d+\s*(\/|out\s+of)\s*\d+/,
      /\d+\s*(%|percent|points)/i,
      /(passed|failed)\s+the\s+(test|interview)/i,
      /performance\s+(was|is)\s+(good|bad|average|excellent|poor)/i,
      /evaluation|assessment|grade|rating/i,
    ];

    for (const pattern of scoringPatterns) {
      if (pattern.test(text)) {
        return {
          safe: false,
          tripwireTriggered: true,
          severity: 'block',
          outputInfo: { reason: 'Output contains scoring information' },
          modifiedOutput: "Thank you for your response. Let's continue with the next question.",
        } as any
      }
    }

    return { safe: true, tripwireTriggered: false, severity: 'none', outputInfo: {} } as any
  },
} as any);

// Output guardrail to maintain professional tone
export const maintainProfessionalTone = defineOutputGuardrail({
  name: 'maintain_professional_tone',
  inputSchema: z.object({
    output: z.string(),
  }),
  async execute(args: any) {
    const text: string = args?.text ?? args?.output ?? ''
    const unprofessionalPatterns = [
      /that\'s\s+(wrong|incorrect|bad)/i,
      /you\'re\s+not\s+getting\s+it/i,
      /terrible|awful|horrible/i,
      /you\s+should\s+know\s+this/i,
      /obviously|clearly\s+wrong/i,
    ];

    for (const pattern of unprofessionalPatterns) {
      if (pattern.test(text)) {
        return {
          safe: false,
          tripwireTriggered: true,
          severity: 'block',
          outputInfo: { reason: 'Output contains unprofessional language' },
          modifiedOutput: text.replace(
            pattern,
            "Thank you for your attempt. Let's explore this from a different angle"
          ),
        } as any
      }
    }

    return { safe: true, tripwireTriggered: false, severity: 'none', outputInfo: {} } as any
  },
} as any);

// Combined guardrails export
export const interviewGuardrails = {
  input: [
    preventSystemInfoExtraction,
    keepOnTopic,
    preventHintExtraction,
  ],
  output: [
    preventScoringInfoLeak,
    maintainProfessionalTone,
  ],
}
