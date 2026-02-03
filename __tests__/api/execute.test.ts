import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Keyword from '@/models/Keyword';
import Prompt from '@/models/Prompt';
import Result from '@/models/Result';

// Mock the database connection to avoid reconnecting with different URI
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

// Mock the OpenRouter library to avoid real API calls
const mockExecutePromptNonStreaming = jest.fn();
jest.mock('@/lib/openrouter', () => ({
  executePromptNonStreaming: (...args: any[]) => mockExecutePromptNonStreaming(...args),
  AVAILABLE_MODELS: [
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
    { id: 'google/gemini-pro', name: 'Gemini Pro' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
    { id: 'meta-llama/llama-3.1-70b-instruct:free', name: 'Llama 3.1 70B (Free)' },
  ],
}));

import { POST } from '@/app/api/execute/route';
import { NextRequest } from 'next/server';

describe('POST /api/execute', () => {
  let userId: string;
  let firebaseUid: string;
  let keywordIds: string[];
  let promptId: string;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test user
    const user = await User.create({
      firebaseUid: 'test-firebase-uid',
      email: 'test@example.com',
    });
    userId = user._id.toString();
    firebaseUid = user.firebaseUid;

    // Create 3 keywords
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
    keywordIds = [keyword1._id.toString(), keyword2._id.toString(), keyword3._id.toString()];

    // Create test prompt
    const prompt = await Prompt.create({
      title: 'Compare Database Systems',
      content: 'Compare PostgreSQL, MySQL, and MongoDB in terms of performance, reliability, and ease of use.',
      user: userId,
    });
    promptId = prompt._id.toString();

    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  describe('with primary and comparison models', () => {
    it('should execute prompt with two different models and detect keywords', async () => {
      // Mock OpenRouter responses for both models
      mockExecutePromptNonStreaming
        .mockResolvedValueOnce({
          text: 'PostgreSQL offers excellent performance and reliability. It is easy to use for developers familiar with SQL.',
          usage: { promptTokens: 10, completionTokens: 20 },
          finishReason: 'stop',
        })
        .mockResolvedValueOnce({
          text: 'MySQL has great performance but can lack reliability at scale. The ease of use is good for beginners.',
          usage: { promptTokens: 10, completionTokens: 20 },
          finishReason: 'stop',
        });

      const requestBody = {
        promptId,
        llmModel: 'google/gemini-2.0-flash-exp:free',
        comparisonModels: ['meta-llama/llama-3.1-70b-instruct:free'],
      };

      // Create a mock NextRequest
      const request = {
        headers: {
          get: (name: string) => name === 'x-firebase-uid' ? firebaseUid : null,
        },
        json: async () => requestBody,
      } as unknown as NextRequest;

      const response = await POST(request);

      // Verify response status
      expect(response.status).toBe(201);

      const data = await response.json();

      // Verify we got results for both models
      expect(data.results).toHaveLength(2);

      // Verify primary model result
      expect(data.results[0].llmModel).toBe('google/gemini-2.0-flash-exp:free');
      expect(data.results[0].response).toContain('PostgreSQL');
      expect(data.results[0].response).toContain('excellent performance');

      // Verify comparison model result
      expect(data.results[1].llmModel).toBe('meta-llama/llama-3.1-70b-instruct:free');
      expect(data.results[1].response).toContain('MySQL');

      // Verify keyword detection in primary model response
      expect(data.results[0].keywordsMentioned.length).toBeGreaterThan(0);
      const perfMention = data.results[0].keywordsMentioned.find(
        (km: any) => km.keywordName === 'performance'
      );
      expect(perfMention).toBeDefined();
      expect(perfMention.sentiment).toBe('positive'); // "excellent performance"

      // Verify keyword detection in comparison model response
      expect(data.results[1].keywordsMentioned.length).toBeGreaterThan(0);

      // Verify results were saved to database
      const savedResults = await Result.find({ user: userId });
      expect(savedResults).toHaveLength(2);
      expect(savedResults[0].llmModel).toBe('google/gemini-2.0-flash-exp:free');
      expect(savedResults[1].llmModel).toBe('meta-llama/llama-3.1-70b-instruct:free');
    });

    it('should detect multiple keywords with sentiment analysis', async () => {
      // Mock response with keywords - note that context windows may overlap
      const mockResponse = {
        text: 'This database has outstanding performance. The reliability is excellent and impressive.',
        usage: { promptTokens: 10, completionTokens: 20 },
        finishReason: 'stop',
      };

      mockExecutePromptNonStreaming.mockResolvedValueOnce(mockResponse);

      const requestBody = {
        promptId,
        llmModel: 'google/gemini-2.0-flash-exp:free',
      };

      const request = {
        headers: {
          get: (name: string) => name === 'x-firebase-uid' ? firebaseUid : null,
        },
        json: async () => requestBody,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await response.json();

      // Should have 2 keyword mentions (performance and reliability)
      expect(data.results[0].keywordsMentioned.length).toBeGreaterThanOrEqual(2);

      // Find each keyword mention
      const perfMention = data.results[0].keywordsMentioned.find(
        (km: any) => km.keywordName === 'performance'
      );
      const relMention = data.results[0].keywordsMentioned.find(
        (km: any) => km.keywordName === 'reliability'
      );

      // Verify sentiment analysis for performance
      expect(perfMention.sentiment).toBe('positive'); // "outstanding performance"

      // Verify sentiment analysis for reliability
      expect(relMention.sentiment).toBe('positive'); // "excellent and impressive"

      // Verify context is captured
      expect(perfMention.context).toContain('outstanding performance');
      expect(relMention.context).toContain('reliability');
    });

    it('should return 401 without firebase uid', async () => {
      const requestBody = {
        promptId,
        llmModel: 'google/gemini-2.0-flash-exp:free',
      };

      const request = {
        headers: {
          get: (name: string) => null,
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
      };

      const request = {
        headers: {
          get: (name: string) => name === 'x-firebase-uid' ? firebaseUid : null,
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
        llmModel: 'google/gemini-2.0-flash-exp:free',
      };

      const request = {
        headers: {
          get: (name: string) => name === 'x-firebase-uid' ? firebaseUid : null,
        },
        json: async () => requestBody,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Prompt ID or content is required');
    });
  });

  describe('with custom prompt content', () => {
    it('should execute prompt with custom content', async () => {
      mockExecutePromptNonStreaming.mockResolvedValueOnce({
        text: 'Custom prompt response about performance and reliability',
        usage: { promptTokens: 10, completionTokens: 20 },
        finishReason: 'stop',
      });

      const requestBody = {
        promptContent: 'Tell me about database performance',
        llmModel: 'google/gemini-2.0-flash-exp:free',
      };

      const request = {
        headers: {
          get: (name: string) => name === 'x-firebase-uid' ? firebaseUid : null,
        },
        json: async () => requestBody,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.results).toHaveLength(1);
      expect(data.results[0].response).toContain('Custom prompt response');
    });
  });
});
