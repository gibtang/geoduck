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
        user: userId,
      });

      await Keyword.create({
        name: 'Keyword 2',
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
    });

    it('should return 400 with missing required fields', async () => {
      const keywordData = {};

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
  });
});
