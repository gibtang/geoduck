import { createRequest, createResponse } from 'node-mocks-http';
import { GET, POST } from '@/app/api/prompts/route';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Prompt from '@/models/Prompt';

describe('Prompts API', () => {
  let userId: string;
  let firebaseUid: string;

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
  });

  describe('GET /api/prompts', () => {
    it('should return user prompts', async () => {
      await Prompt.create({
        title: 'Prompt 1',
        content: 'Content 1',
        category: 'Category 1',
        user: userId,
      });

      await Prompt.create({
        title: 'Prompt 2',
        content: 'Content 2',
        category: 'Category 2',
        user: userId,
      });

      const request = createRequest({
        method: 'GET',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await GET(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].title).toBe('Prompt 1');
      expect(data[1].title).toBe('Prompt 2');
    });

    it('should return empty array for user with no prompts', async () => {
      const request = createRequest({
        method: 'GET',
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
        headers: {},
      });

      const response = createResponse();

      await GET(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/prompts', () => {
    it('should create a new prompt', async () => {
      const promptData = {
        title: 'New Prompt',
        content: 'What are the best products?',
        category: 'Product Discovery',
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: promptData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(201);
      expect(data.title).toBe(promptData.title);
      expect(data.content).toBe(promptData.content);
      expect(data.category).toBe(promptData.category);
    });

    it('should return 400 with missing required fields', async () => {
      const promptData = {
        title: 'New Prompt',
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: promptData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 401 without firebase uid', async () => {
      const promptData = {
        title: 'New Prompt',
        content: 'Content',
        category: 'Category',
      };

      const request = createRequest({
        method: 'POST',
        headers: {},
        body: promptData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
