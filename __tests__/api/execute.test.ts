import { createRequest, createResponse } from 'node-mocks-http';
import { POST, GET } from '@/app/api/execute/route';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Prompt from '@/models/Prompt';
import Keyword from '@/models/Keyword';

// Mock the openrouter module
jest.mock('@/lib/openrouter', () => ({
  AVAILABLE_MODELS: [
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
  ],
  executePromptNonStreaming: jest.fn(),
}));

// Mock the keywordDetection module
jest.mock('@/lib/keywordDetection', () => ({
  detectKeywordMentions: jest.fn(() => []),
}));

import { executePromptNonStreaming } from '@/lib/openrouter';
import { detectKeywordMentions } from '@/lib/keywordDetection';

describe('Execute API', () => {
  let userId: string;
  let firebaseUid: string;
  let promptId: string;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    const user = await User.create({
      firebaseUid: 'test-firebase-uid',
      email: 'test@example.com',
    });
    userId = user._id.toString();
    firebaseUid = user.firebaseUid;

    const prompt = await Prompt.create({
      title: 'Test Prompt',
      content: 'What are the best keywords?',
      user: userId,
    });
    promptId = prompt._id.toString();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /api/execute', () => {
    it('should return available models', async () => {
      const request = createRequest({
        method: 'GET',
      });

      const response = createResponse();

      await GET(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data.models).toEqual([
        { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'openai/gpt-4o', name: 'GPT-4o' },
      ]);
    });
  });

  describe('POST /api/execute', () => {
    beforeEach(() => {
      (executePromptNonStreaming as jest.Mock).mockResolvedValue({
        text: 'This is a test response with keyword mentions',
      });
    });

    it('should execute prompt with promptId', async () => {
      const requestBody = {
        promptId,
        llmModel: 'google/gemini-2.5-flash',
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: requestBody,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(201);
      expect(data.results).toBeDefined();
      expect(data.results).toHaveLength(1);
      expect(data.results[0].llmModel).toBe('google/gemini-2.5-flash');
      expect(executePromptNonStreaming).toHaveBeenCalledWith(
        'google/gemini-2.5-flash',
        'What are the best keywords?'
      );
    });

    it('should execute prompt with promptContent', async () => {
      const requestBody = {
        promptContent: 'What is AI?',
        llmModel: 'openai/gpt-4o',
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: requestBody,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(201);
      expect(data.results).toHaveLength(1);
      expect(executePromptNonStreaming).toHaveBeenCalledWith('openai/gpt-4o', 'What is AI?');
    });

    it('should execute with comparison models', async () => {
      const requestBody = {
        promptId,
        llmModel: 'google/gemini-2.5-flash',
        comparisonModels: ['openai/gpt-4o'],
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: requestBody,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(201);
      expect(data.results).toHaveLength(2);
      expect(executePromptNonStreaming).toHaveBeenCalledTimes(2);
    });

    it('should return 400 when model is missing', async () => {
      const requestBody = {
        promptId,
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: requestBody,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(400);
      expect(data.error).toBe('Model is required');
    });

    it('should return 400 when promptId and promptContent are missing', async () => {
      const requestBody = {
        llmModel: 'google/gemini-2.5-flash',
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: requestBody,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(400);
      expect(data.error).toBe('Prompt ID or content is required');
    });

    it('should return 404 when prompt not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const requestBody = {
        promptId: fakeId,
        llmModel: 'google/gemini-2.5-flash',
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: requestBody,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(404);
      expect(data.error).toBe('Prompt not found');
    });

    it('should return 401 without firebase uid', async () => {
      const requestBody = {
        promptId,
        llmModel: 'google/gemini-2.5-flash',
      };

      const request = createRequest({
        method: 'POST',
        headers: {},
        body: requestBody,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should filter by selected keyword ids', async () => {
      const keyword1 = await Keyword.create({
        name: 'keyword1',
        user: userId,
      });

      const keyword2 = await Keyword.create({
        name: 'keyword2',
        user: userId,
      });

      const requestBody = {
        promptId,
        llmModel: 'google/gemini-2.5-flash',
        selectedKeywordIds: [keyword1._id.toString()],
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: requestBody,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      expect(response._getStatusCode()).toBe(201);
      expect(detectKeywordMentions).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            _id: keyword1._id,
          }),
        ])
      );
    });

    it('should handle errors from executePromptNonStreaming', async () => {
      (executePromptNonStreaming as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const requestBody = {
        promptId,
        llmModel: 'google/gemini-2.5-flash',
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: requestBody,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(500);
      expect(data.error).toBe('Failed to execute prompt');
      expect(data.details).toBe('API Error');
    });
  });
});
