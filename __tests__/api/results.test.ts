import { createRequest, createResponse } from 'node-mocks-http';
import { GET } from '@/app/api/results/route';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Result from '@/models/Result';
import Prompt from '@/models/Prompt';

describe('Results API', () => {
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
      content: 'Test content',
      user: userId,
    });
    promptId = prompt._id.toString();
  });

  describe('GET /api/results', () => {
    it('should return user results with default pagination', async () => {
      // Create multiple results
      await Result.create({
        prompt: promptId,
        llmModel: 'google/gemini-2.5-flash',
        response: 'Response 1',
        user: userId,
      });

      await Result.create({
        prompt: promptId,
        llmModel: 'openai/gpt-4o',
        response: 'Response 2',
        user: userId,
      });

      const request = createRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/results',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await GET(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].llmModel).toBe('google/gemini-2.5-flash');
      expect(data[1].llmModel).toBe('openai/gpt-4o');
    });

    it('should respect limit parameter', async () => {
      // Create 5 results
      for (let i = 0; i < 5; i++) {
        await Result.create({
          prompt: promptId,
          llmModel: `model-${i}`,
          response: `Response ${i}`,
          user: userId,
        });
      }

      const request = createRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/results?limit=3',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await GET(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data).toHaveLength(3);
    });

    it('should respect skip parameter', async () => {
      // Create 5 results
      for (let i = 0; i < 5; i++) {
        await Result.create({
          prompt: promptId,
          llmModel: `model-${i}`,
          response: `Response ${i}`,
          user: userId,
        });
      }

      const request = createRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/results?skip=2',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await GET(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data).toHaveLength(3);
    });

    it('should return empty array for user with no results', async () => {
      const request = createRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/results',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await GET(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return 401 without firebase uid', async () => {
      const request = createRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/results',
        headers: {},
      });

      const response = createResponse();

      await GET(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent user', async () => {
      const request = createRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/results',
        headers: {
          'x-firebase-uid': 'non-existent-uid',
        },
      });

      const response = createResponse();

      await GET(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should sort results by createdAt descending', async () => {
      const result1 = await Result.create({
        prompt: promptId,
        llmModel: 'model-1',
        response: 'Response 1',
        user: userId,
      });

      // Wait to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const result2 = await Result.create({
        prompt: promptId,
        llmModel: 'model-2',
        response: 'Response 2',
        user: userId,
      });

      const request = createRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/results',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await GET(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data[0]._id).toBe(result2._id.toString());
      expect(data[1]._id).toBe(result1._id.toString());
    });
  });
});
