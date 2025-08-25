import { tool } from '@openai/agents'
import { z } from 'zod'
// Optional heavy deps – use ambient types to avoid TS errors if not installed
// import * as faceapi from 'face-api.js'
// import '@tensorflow/tfjs-node'
import { SentimentData } from '../types'

// Initialize face-api models (should be done once at startup)
let modelsLoaded = false

export async function loadFaceModels() {
  // No-op placeholder to keep API surface; real loading can be wired later
  modelsLoaded = true
}

export const analyzeFacialSentimentTool = tool({
  name: 'analyze_facial_sentiment',
  description: 'Analyze facial expressions and detect multiple faces for cheating detection',
  parameters: z.object({
    // For portability, accept pre-extracted features (from client) or raw image
    imageData: z.string().describe('Base64 image (optional if features provided)').optional(),
    features: z
      .object({
        faceCount: z.number(),
        primaryEmotion: z.enum(['HAPPY', 'NEUTRAL', 'STRESSED', 'NERVOUS', 'CONFUSED']).optional(),
        emotionConfidence: z.number().min(0).max(1).optional(),
      })
      .optional(),
    timestamp: z.string(),
  }),
  execute: async ({ imageData, features, timestamp }: { imageData?: string; features?: { faceCount: number; primaryEmotion?: 'HAPPY' | 'NEUTRAL' | 'STRESSED' | 'NERVOUS' | 'CONFUSED'; emotionConfidence?: number }; timestamp: string }) => {
    // If client provided features, trust them to avoid heavy server-side libs
    if (features) {
      const cheatingFlags: any[] = []
      if (features.faceCount === 0) {
        cheatingFlags.push({ type: 'NO_FACE', severity: 'HIGH', description: 'No face detected in frame' })
      } else if (features.faceCount > 1) {
        cheatingFlags.push({ type: 'MULTIPLE_FACES', severity: 'HIGH', description: `${features.faceCount} faces detected in frame` })
      }
      return {
        timestamp,
        facialSentiment: {
          detected: features.faceCount > 0,
          emotion: features.primaryEmotion || 'NEUTRAL',
          confidence: features.emotionConfidence ?? 0.5,
          faceCount: features.faceCount,
        },
        cheatingFlags,
      }
    }

    // Fallback: without features, we cannot compute reliably here; return neutral
    return {
      timestamp,
      facialSentiment: {
        detected: false,
        faceCount: 0,
        emotion: 'NEUTRAL',
        confidence: 0.5,
      },
      cheatingFlags: [],
    }
  },
})

export const analyzeAudioSentimentTool = tool({
  name: 'analyze_audio_sentiment',
  description: 'Analyze audio for pace, tone, and confidence indicators',
  parameters: z.object({
    audioFeatures: z.object({
      volume: z.number().min(0).max(1),
      pitch: z.number(),
      speechRate: z.number().describe('Words per minute'),
      silenceRatio: z.number().min(0).max(1),
      fillerWordCount: z.number(),
    }),
    timestamp: z.string(),
  }),
  execute: async ({ audioFeatures, timestamp }: { audioFeatures: { volume: number; pitch: number; speechRate: number; silenceRatio: number; fillerWordCount: number }; timestamp: string }) => {
    const { volume, pitch, speechRate, silenceRatio, fillerWordCount } = audioFeatures;

    // Determine pace
    let pace: 'SLOW' | 'NORMAL' | 'FAST' = 'NORMAL';
    if (speechRate < 100) pace = 'SLOW';
    else if (speechRate > 180) pace = 'FAST';

    // Determine tone based on pitch and volume patterns
    let tone: 'NERVOUS' | 'CONFIDENT' | 'NEUTRAL' | 'STRESSED' = 'NEUTRAL';
    let confidence = 0.5;

    // High filler words indicate nervousness
    if (fillerWordCount > 5) {
      tone = 'NERVOUS';
      confidence -= 0.2;
    }

    // Very high or very low pitch can indicate stress
    if (pitch > 300 || pitch < 80) {
      tone = 'STRESSED';
      confidence -= 0.1;
    }

    // High silence ratio might indicate uncertainty
    if (silenceRatio > 0.4) {
      confidence -= 0.15;
      if (tone === 'NEUTRAL') tone = 'NERVOUS';
    }

    // Low volume might indicate lack of confidence
    if (volume < 0.3) {
      confidence -= 0.1;
    } else if (volume > 0.7 && pace === 'NORMAL') {
      confidence += 0.1;
      if (tone === 'NEUTRAL') tone = 'CONFIDENT';
    }

    // Normal speech rate with low filler words indicates confidence
    if (speechRate >= 120 && speechRate <= 160 && fillerWordCount < 2) {
      confidence += 0.2;
      tone = 'CONFIDENT';
    }

    confidence = Math.max(0, Math.min(1, confidence));

    return {
      timestamp,
      audioSentiment: {
        confidence,
        pace,
        tone,
        volume: volume > 0.7 ? 'HIGH' : volume < 0.3 ? 'LOW' : 'NORMAL',
      },
    }
  },
})

export const detectCheatingBehaviorTool = tool({
  name: 'detect_cheating_behavior',
  description: 'Detect potential cheating behaviors from multiple data sources',
  parameters: z.object({
    tabSwitches: z.number(),
    backgroundNoiseLevel: z.number().min(0).max(1),
    eyeGazeDeviation: z.number().min(0).max(1).optional(),
    typingPatterns: z.object({
      suddenCopyPaste: z.boolean(),
      unusualSpeed: z.boolean(),
    }).optional(),
    timestamp: z.string(),
  }),
  execute: async ({ tabSwitches, backgroundNoiseLevel, eyeGazeDeviation, typingPatterns, timestamp }: { tabSwitches: number; backgroundNoiseLevel: number; eyeGazeDeviation?: number; typingPatterns?: { suddenCopyPaste: boolean; unusualSpeed: boolean }; timestamp: string }) => {
    const flags = [];

    // Tab switching detection
    if (tabSwitches > 0) {
      flags.push({
        type: 'TAB_SWITCH',
        severity: tabSwitches > 2 ? 'HIGH' : 'MEDIUM',
        description: `Tab switched ${tabSwitches} time(s)`,
        timestamp,
      });
    }

    // Suspicious background noise
    if (backgroundNoiseLevel > 0.7) {
      flags.push({
        type: 'SUSPICIOUS_AUDIO',
        severity: 'MEDIUM',
        description: 'High background noise detected, possible consultation',
        timestamp,
      });
    }

    // Eye gaze deviation (looking away from screen)
    if (eyeGazeDeviation && eyeGazeDeviation > 0.6) {
      flags.push({
        type: 'SUSPICIOUS_BEHAVIOR',
        severity: 'LOW',
        description: 'Frequent gaze deviation from screen',
        timestamp,
      });
    }

    // Copy-paste detection
    if (typingPatterns?.suddenCopyPaste) {
      flags.push({
        type: 'COPY_PASTE',
        severity: 'MEDIUM',
        description: 'Sudden code paste detected',
        timestamp,
      });
    }

    // Unusual typing speed
    if (typingPatterns?.unusualSpeed) {
      flags.push({
        type: 'UNUSUAL_TYPING',
        severity: 'LOW',
        description: 'Unusually fast typing detected',
        timestamp,
      });
    }

    return {
      hasSuspiciousBehavior: flags.length > 0,
      flags,
      riskLevel: calculateRiskLevel(flags),
    }
  },
})

function calculateRiskLevel(flags: any[]): 'LOW' | 'MEDIUM' | 'HIGH' {
  const highSeverityCount = flags.filter(f => f.severity === 'HIGH').length;
  const mediumSeverityCount = flags.filter(f => f.severity === 'MEDIUM').length;

  if (highSeverityCount > 0) return 'HIGH';
  if (mediumSeverityCount >= 2) return 'HIGH';
  if (mediumSeverityCount === 1) return 'MEDIUM';
  return 'LOW';
}

export const sentimentAnalysisTools = [
  analyzeFacialSentimentTool,
  analyzeAudioSentimentTool,
  detectCheatingBehaviorTool,
]
