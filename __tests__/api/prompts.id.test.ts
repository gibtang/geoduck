import { createRequest, createResponse } from 'node-mocks-http';
import { GET, PUT, DELETE } from '@/app/api/prompts/[id]/route';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Prompt from '@/models/Prompt';

describe('Prompts [id] API', () => {
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

  describe('GET /api/prompts/[id]', () => {
    it('should return single prompt by id', async () => {
      const request = createRequest({
        method: 'GET',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await GET(request as any, response as any, { params: Promise.resolve({ id: promptId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data.title).toBe('Test Prompt');
      expect(data.content).toBe('Test content');
      expect(data._id).toBe(promptId);
    });

    it('should return 404 for non-existent prompt', async () => {
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
      expect(data.error).toBe('Prompt not found');
    });

    it('should return 401 without firebase uid', async () => {
      const request = createRequest({
        method: 'GET',
        headers: {},
      });

      const response = createResponse();

      await GET(request as any, response as any, { params: Promise.resolve({ id: promptId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for user with different firebase uid', async () => {
      const otherUser = await User.create({
        firebaseUid: 'other-firebase-uid',
        email: 'other@example.com',
      });

      const request = createRequest({
        method: 'GET',
        headers: {
          'x-firebase-uid': otherUser.firebaseUid,
        },
      });

      const response = createResponse();

      await GET(request as any, response as any, { params: Promise.resolve({ id: promptId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(404);
      expect(data.error).toBe('Prompt not found');
    });
  });

  describe('PUT /api/prompts/[id]', () => {
    it('should update prompt', async () => {
      const updateData = {
        title: 'Updated Prompt',
        content: 'Updated content',
      };

      const request = createRequest({
        method: 'PUT',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: updateData,
      });

      const response = createResponse();

      await PUT(request as any, response as any, { params: Promise.resolve({ id: promptId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data.title).toBe('Updated Prompt');
      expect(data.content).toBe('Updated content');
    });

    it('should return 404 for non-existent prompt', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { title: 'Updated Prompt', content: 'Updated content' };

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
      expect(data.error).toBe('Prompt not found');
    });

    it('should return 401 without firebase uid', async () => {
      const updateData = { title: 'Updated Prompt', content: 'Updated content' };

      const request = createRequest({
        method: 'PUT',
        headers: {},
        body: updateData,
      });

      const response = createResponse();

      await PUT(request as any, response as any, { params: Promise.resolve({ id: promptId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/prompts/[id]', () => {
    it('should delete prompt', async () => {
      const request = createRequest({
        method: 'DELETE',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
      });

      const response = createResponse();

      await DELETE(request as any, response as any, { params: Promise.resolve({ id: promptId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data.message).toBe('Prompt deleted successfully');

      // Verify prompt is deleted
      const prompt = await Prompt.findById(promptId);
      expect(prompt).toBeNull();
    });

    it('should return 404 for non-existent prompt', async () => {
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
      expect(data.error).toBe('Prompt not found');
    });

    it('should return 401 without firebase uid', async () => {
      const request = createRequest({
        method: 'DELETE',
        headers: {},
      });

      const response = createResponse();

      await DELETE(request as any, response as any, { params: Promise.resolve({ id: promptId }) });

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
