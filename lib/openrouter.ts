import OpenAI from 'openai';
import { serverEnv } from './env';

// Lazy initialization function to get the OpenAI client
// This ensures we use the latest process.env.OPENROUTER_API_KEY value
function getOpenRouterClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    // Read directly from process.env to get the latest value (especially for integration tests)
    apiKey: process.env.OPENROUTER_API_KEY || serverEnv.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Geoduck',
    },
  });
}

export const AVAILABLE_MODELS = [
  // OpenAI
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  // Anthropic (Claude)
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
  // Google (Gemini)
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
  { id: 'google/gemini-pro', name: 'Gemini Pro' },
  // xAI (Grok)
  { id: 'x-ai/grok-2', name: 'Grok-2' },
] as const;

export async function executePrompt(model: string, prompt: string) {
  try {
    const openrouter = getOpenRouterClient();
    const result = await openrouter.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    // Return streaming-compatible format
    return {
      stream: result,
      text: Promise.resolve(''), // Placeholder for streaming interface
    };
  } catch (error) {
    console.error('Error executing prompt:', error);
    throw error;
  }
}

export async function executePromptNonStreaming(model: string, prompt: string) {
  try {
    const openrouter = getOpenRouterClient();

    const result = await openrouter.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      text: result.choices[0]?.message?.content || '',
      usage: result.usage,
      finishReason: result.choices[0]?.finish_reason,
    };
  } catch (error) {
    console.error('Error executing prompt:', error);
    throw error;
  }
}
