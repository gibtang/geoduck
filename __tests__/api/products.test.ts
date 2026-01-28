import { createRequest, createResponse } from 'node-mocks-http';
import { GET, POST } from '@/app/api/keywords/route';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Keyword from '@/models/Keyword';

describe('Keywords API', () => {
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

  describe('GET /api/keywords', () => {
    it('should return user keywords', async () => {
      await Keyword.create({
        name: 'Keyword 1',
        description: 'Description 1',
        category: 'Category 1',
        price: 99.99,
        user: userId,
      });

      await Keyword.create({
        name: 'Keyword 2',
        description: 'Description 2',
        category: 'Category 2',
        price: 149.99,
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
      expect(data[0].name).toBe('Keyword 1');
      expect(data[1].name).toBe('Keyword 2');
    });

    it('should return empty array for user with no keywords', async () => {
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

    it('should return 404 for non-existent user', async () => {
      const request = createRequest({
        method: 'GET',
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
  });

  describe('POST /api/keywords', () => {
    it('should create a new keyword', async () => {
      const keywordData = {
        name: 'New Keyword',
        description: 'New keyword description',
        category: 'Electronics',
        price: 299.99,
        keywords: ['test', 'new'],
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: keywordData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(201);
      expect(data.name).toBe(keywordData.name);
      expect(data.description).toBe(keywordData.description);
      expect(data.category).toBe(keywordData.category);
      expect(data.price).toBe(keywordData.price);
      expect(data.keywords).toEqual(keywordData.keywords);
    });

    it('should create keyword without keywords', async () => {
      const keywordData = {
        name: 'New Keyword',
        description: 'New keyword description',
        category: 'Electronics',
        price: 299.99,
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: keywordData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(201);
      expect(data.keywords).toEqual([]);
    });

    it('should return 400 with missing required fields', async () => {
      const keywordData = {
        name: 'New Keyword',
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: keywordData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 401 without firebase uid', async () => {
      const keywordData = {
        name: 'New Keyword',
        description: 'Description',
        category: 'Category',
        price: 99.99,
      };

      const request = createRequest({
        method: 'POST',
        headers: {},
        body: keywordData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent user', async () => {
      const keywordData = {
        name: 'New Keyword',
        description: 'Description',
        category: 'Category',
        price: 99.99,
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': 'non-existent-uid',
        },
        body: keywordData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });
});
