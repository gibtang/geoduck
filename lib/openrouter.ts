import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { serverEnv } from './env';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: serverEnv.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Geoduck',
  },
});

// Debug logging (remove in production)
if (process.env.NODE_ENV === 'test') {
  console.log('[openrouter] API Key loaded:', {
    hasKey: !!serverEnv.OPENROUTER_API_KEY,
    keyLength: serverEnv.OPENROUTER_API_KEY?.length,
    keyPrefix: serverEnv.OPENROUTER_API_KEY?.substring(0, 7) + '...',
  });
}

export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp' },
  { id: 'google/gemini-flash', name: 'Gemini Flash' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
] as const;

export async function executePrompt(model: string, prompt: string) {
  try {
    const result = await streamText({
      model: openrouter(model),
      prompt,
    });

    return result;
  } catch (error) {
    console.error('Error executing prompt:', error);
    throw error;
  }
}

export async function executePromptNonStreaming(model: string, prompt: string) {
  try {
    const result = await generateText({
      model: openrouter(model),
      prompt,
    });

    return result;
  } catch (error) {
    console.error('Error executing prompt:', error);
    throw error;
  }
}
