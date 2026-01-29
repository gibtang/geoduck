import { createRequest, createResponse } from 'node-mocks-http';
import { GET, PUT, DELETE } from '@/app/api/keywords/[id]/route';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Keyword from '@/models/Keyword';

describe('Keywords [id] API', () => {
  let userId: string;
  let firebaseUid: string;
  let keywordId: string;

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

    const keyword = await Keyword.create({
      name: 'Test Keyword',
      user: userId,
    });
    keywordId = keyword._id.toString();
  });

  describe('GET /api/keywords/[id]', () => {
    it('should return single keyword by id', async () => {
      const request = createRequest({
        method: 'GET',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await GET(request as any, response as any, { params: Promise.resolve({ id: keywordId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data.name).toBe('Test Keyword');
      expect(data._id).toBe(keywordId);
    });

    it('should return 404 for non-existent keyword', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const request = createRequest({
        method: 'GET',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await GET(request as any, response as any, { params: Promise.resolve({ id: fakeId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(404);
      expect(data.error).toBe('Keyword not found');
    });

    it('should return 401 without firebase uid', async () => {
      const request = createRequest({
        method: 'GET',
        headers: {},
      });

      const response = createResponse();

      await GET(request as any, response as any, { params: Promise.resolve({ id: keywordId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/keywords/[id]', () => {
    it('should update keyword', async () => {
      const updateData = {
        name: 'Updated Keyword',
      };

      const request = createRequest({
        method: 'PUT',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: updateData,
      });

      const response = createResponse();

      await PUT(request as any, response as any, { params: Promise.resolve({ id: keywordId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data.name).toBe('Updated Keyword');
    });

    it('should return 404 for non-existent keyword', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { name: 'Updated Keyword' };

      const request = createRequest({
        method: 'PUT',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: updateData,
      });

      const response = createResponse();

      await PUT(request as any, response as any, { params: Promise.resolve({ id: fakeId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(404);
      expect(data.error).toBe('Keyword not found');
    });

    it('should return 401 without firebase uid', async () => {
      const updateData = { name: 'Updated Keyword' };

      const request = createRequest({
        method: 'PUT',
        headers: {},
        body: updateData,
      });

      const response = createResponse();

      await PUT(request as any, response as any, { params: Promise.resolve({ id: keywordId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/keywords/[id]', () => {
    it('should delete keyword', async () => {
      const request = createRequest({
        method: 'DELETE',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await DELETE(request as any, response as any, { params: Promise.resolve({ id: keywordId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data.message).toBe('Keyword deleted successfully');

      // Verify keyword is deleted
      const keyword = await Keyword.findById(keywordId);
      expect(keyword).toBeNull();
    });

    it('should return 404 for non-existent keyword', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const request = createRequest({
        method: 'DELETE',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await DELETE(request as any, response as any, { params: Promise.resolve({ id: fakeId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(404);
      expect(data.error).toBe('Keyword not found');
    });

    it('should return 401 without firebase uid', async () => {
      const request = createRequest({
        method: 'DELETE',
        headers: {},
      });

      const response = createResponse();

      await DELETE(request as any, response as any, { params: Promise.resolve({ id: keywordId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
