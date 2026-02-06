// Load environment variables BEFORE any other imports
// This ensures OPENROUTER_API_KEY is loaded before jest.setup.js sets test values
const dotenv = require('dotenv');
const path = require('path');
const envResult = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (envResult.error) {
  console.error('Error loading .env.local:', envResult.error);
}

import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Keyword from '@/models/Keyword';
import Prompt from '@/models/Prompt';
import Result from '@/models/Result';
import { POST } from '@/app/api/execute/route';
import { NextRequest } from 'next/server';

// Mock the database connection to avoid reconnecting with different URI
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

// Integration tests with REAL OpenRouter API calls
// These tests make actual API calls to OpenRouter using free models
// Set OPENROUTER_API_KEY in .env.local before running

describe('POST /api/execute - Real OpenRouter API Integration', () => {
  let userId: string;
  let firebaseUid: string;
  let keywordIds: string[];
  let promptId: string;

  beforeAll(async () => {
    // Reload .env.local to ensure we have the real API key
    // This is needed because jest.setup.js may have overwritten it
    const dotenv = require('dotenv');
    const path = require('path');
    const envConfig = dotenv.config({
      path: path.resolve(process.cwd(), '.env.local'),
      override: true,  // Override existing environment variables
    });

    if (envConfig.error) {
      throw envConfig.error;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'test-openrouter-key' || !apiKey.startsWith('sk-or-v1-')) {
      throw new Error(
        'OPENROUTER_API_KEY must be set in .env.local for integration tests.\n' +
        'Current value: ' + (apiKey ? apiKey.substring(0, 20) + '...' : 'NOT SET') + '\n' +
        'Get your free API key at https://openrouter.ai/keys'
      );
    }

    console.log('✅ Real OpenRouter API key loaded');
    console.log('   Key prefix:', apiKey.substring(0, 15) + '...');
    console.log('   Key length:', apiKey.length);
    console.log('   Key format valid:', apiKey.startsWith('sk-or-v1-'));

    // Clear the require cache so that env.ts and openrouter.ts re-read process.env.OPENROUTER_API_KEY
    delete require.cache[require.resolve('@/lib/env')];
    delete require.cache[require.resolve('@/lib/openrouter')];

    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test user
    const user = await User.create({
      firebaseUid: 'integration-test-user',
      email: 'integration-test@example.com',
    });
    userId = user._id.toString();
    firebaseUid = user.firebaseUid;

    // Create 3 keywords for testing
    const keyword1 = await Keyword.create({
      name: 'performance',
      user: userId,
    });
    const keyword2 = await Keyword.create({
      name: 'reliability',
      user: userId,
    });
    const keyword3 = await Keyword.create({
      name: 'ease of use',
      user: userId,
    });
    keywordIds = [
      keyword1._id.toString(),
      keyword2._id.toString(),
      keyword3._id.toString(),
    ];

    // Create test prompt about databases (will trigger keyword mentions)
    const prompt = await Prompt.create({
      title: 'Database Comparison',
      content: 'Compare PostgreSQL and MySQL in terms of their performance, reliability, and ease of use for web applications.',
      user: userId,
    });
    promptId = prompt._id.toString();
  });

  describe('Real API calls with free models', () => {
    it('should execute prompt with two free models and detect keywords', async () => {
      // Increase timeout for real API calls
      jest.setTimeout(30000);

      const requestBody = {
        promptId,
        llmModel: 'openai/gpt-3.5-turbo',
        comparisonModels: ['openai/gpt-4o-mini'],
      };

      const request = {
        headers: {
          get: (name: string) => (name === 'x-firebase-uid' ? firebaseUid : null),
        },
        json: async () => requestBody,
      } as unknown as NextRequest;

      const response = await POST(request);

      // Verify successful response
      expect(response.status).toBe(201);

      const data = await response.json();

      // Should have results from both models
      expect(data.results).toHaveLength(2);

      // Verify primary model (Gemini)
      expect(data.results[0].llmModel).toBe('openai/gpt-3.5-turbo');
      expect(data.results[0].response).toBeTruthy();
      expect(data.results[0].response.length).toBeGreaterThan(50); // Real LLM response

      // Verify comparison model (Llama)
      expect(data.results[1].llmModel).toBe('openai/gpt-4o-mini');
      expect(data.results[1].response).toBeTruthy();
      expect(data.results[1].response.length).toBeGreaterThan(50); // Real LLM response

      // Verify responses are different (different models generate different text)
      expect(data.results[0].response).not.toEqual(data.results[1].response);

      // Verify keyword detection worked
      expect(data.results[0].keywordsMentioned).toBeDefined();
      expect(Array.isArray(data.results[0].keywordsMentioned)).toBe(true);

      expect(data.results[1].keywordsMentioned).toBeDefined();
      expect(Array.isArray(data.results[1].keywordsMentioned)).toBe(true);

      // Log sample responses for verification
      console.log('\n=== Real API Response Samples ===');
      console.log('Gemini 2.0 Flash Response (first 200 chars):');
      console.log(data.results[0].response.substring(0, 200) + '...');
      console.log('\nKeywords detected:', data.results[0].keywordsMentioned.length);
      console.log('\nLlama 3.1 70B Response (first 200 chars):');
      console.log(data.results[1].response.substring(0, 200) + '...');
      console.log('\nKeywords detected:', data.results[1].keywordsMentioned.length);
      console.log('=================================\n');

      // Verify results were saved to database
      const savedResults = await Result.find({ user: userId });
      expect(savedResults).toHaveLength(2);
      expect(savedResults[0].llmModel).toBe('openai/gpt-3.5-turbo');
      expect(savedResults[1].llmModel).toBe('openai/gpt-4o-mini');
    }, 30000); // 30 second timeout

    it('should detect keywords and analyze sentiment in real LLM responses', async () => {
      jest.setTimeout(30000);

      const requestBody = {
        promptId,
        llmModel: 'openai/gpt-3.5-turbo',
      };

      const request = {
        headers: {
          get: (name: string) => (name === 'x-firebase-uid' ? firebaseUid : null),
        },
        json: async () => requestBody,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.results).toHaveLength(1);

      const result = data.results[0];

      // Verify keyword mentions structure
      expect(result.keywordsMentioned).toBeDefined();
      expect(Array.isArray(result.keywordsMentioned)).toBe(true);

      // If keywords were detected, verify their structure
      if (result.keywordsMentioned.length > 0) {
        const firstMention = result.keywordsMentioned[0];

        // Verify required fields
        expect(firstMention).toHaveProperty('keywordId');
        expect(firstMention).toHaveProperty('keywordName');
        expect(firstMention).toHaveProperty('position');
        expect(firstMention).toHaveProperty('sentiment');
        expect(firstMention).toHaveProperty('context');

        // Verify sentiment is valid
        expect(['positive', 'neutral', 'negative']).toContain(firstMention.sentiment);

        // Verify context contains the keyword
        expect(firstMention.context.toLowerCase()).toContain(
          firstMention.keywordName.toLowerCase()
        );

        console.log('\n=== Keyword Detection Details ===');
        console.log(`Keywords detected: ${result.keywordsMentioned.length}`);
        result.keywordsMentioned.forEach((km: any) => {
          console.log(`- "${km.keywordName}": ${km.sentiment} sentiment`);
          console.log(`  Context: "${km.context}"`);
        });
        console.log('=================================\n');
      }
    }, 30000);

    it('should execute with custom prompt content (not saved prompt)', async () => {
      jest.setTimeout(30000);

      const customPrompt = 'What are the main advantages of using PostgreSQL?';

      const requestBody = {
        promptContent: customPrompt,
        llmModel: 'openai/gpt-3.5-turbo',
      };

      const request = {
        headers: {
          get: (name: string) => (name === 'x-firebase-uid' ? firebaseUid : null),
        },
        json: async () => requestBody,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.results).toHaveLength(1);
      expect(data.results[0].response).toBeTruthy();
      expect(data.results[0].response.length).toBeGreaterThan(50);

      // Verify the response is about PostgreSQL (sanity check)
      expect(data.results[0].response.toLowerCase()).toMatch(
        /postgres|database|sql/
      );
    }, 30000);

    it('should handle errors gracefully with invalid model', async () => {
      jest.setTimeout(30000);

      const requestBody = {
        promptId,
        llmModel: 'invalid-model-that-does-not-exist',
      };

      const request = {
        headers: {
          get: (name: string) => (name === 'x-firebase-uid' ? firebaseUid : null),
        },
        json: async () => requestBody,
      } as unknown as NextRequest;

      const response = await POST(request);

      // Should return an error status
      expect(response.status).toBeGreaterThanOrEqual(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    }, 30000);
  });

  describe('Authentication and validation', () => {
    it('should return 401 without authentication', async () => {
      const requestBody = {
        promptId,
        llmModel: 'openai/gpt-3.5-turbo',
      };

      const request = {
        headers: {
          get: (name: string) => null, // No auth header
        },
        json: async () => requestBody,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when model is missing', async () => {
      const requestBody = {
        promptId,
        // Missing llmModel
      };

      const request = {
        headers: {
          get: (name: string) => (name === 'x-firebase-uid' ? firebaseUid : null),
        },
        json: async () => requestBody,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Model is required');
    });

    it('should return 400 when promptId and promptContent are both missing', async () => {
      const requestBody = {
        llmModel: 'openai/gpt-3.5-turbo',
        // Missing both promptId and promptContent
      };

      const request = {
        headers: {
          get: (name: string) => (name === 'x-firebase-uid' ? firebaseUid : null),
        },
        json: async () => requestBody,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Prompt ID or content is required');
    });
  });
});
