export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4-turbo-preview',
  },
  google: {
    apiKey: process.env.GEMINI_API_KEY!,
    model: 'models/gemini-2.5-flash-preview-native-audio-dialog',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE!,
  },
  judge0: {
    apiUrl: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
    apiKey: process.env.JUDGE0_API_KEY!,
  },
  tracing: {
    enabled: process.env.NODE_ENV === 'production',
    exportApiKey: process.env.OPENAI_TRACING_API_KEY,
  },
} as const;
