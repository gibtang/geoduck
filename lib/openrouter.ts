import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { serverEnv } from './env';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: serverEnv.OPENROUTER_API_KEY,
});

export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'meta-llama/llama-3.1-70b-instruct:free', name: 'Llama 3.1 70B (Free)' },
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
