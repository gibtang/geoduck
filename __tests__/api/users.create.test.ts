import { createRequest, createResponse } from 'node-mocks-http';
import { POST } from '@/app/api/users/create/route';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';

describe('Users Create API', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/users/create', () => {
    it('should create a new user', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid',
        email: 'test@example.com',
      };

      const request = createRequest({
        method: 'POST',
        body: userData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(201);
      expect(data.firebaseUid).toBe('test-firebase-uid');
      expect(data.email).toBe('test@example.com');
      expect(data._id).toBeDefined();

      // Verify user was saved to database
      const user = await User.findOne({ firebaseUid: 'test-firebase-uid' });
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    });

    it('should convert email to lowercase', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid',
        email: 'TEST@EXAMPLE.COM',
      };

      const request = createRequest({
        method: 'POST',
        body: userData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(201);
      expect(data.email).toBe('test@example.com');

      const user = await User.findOne({ firebaseUid: 'test-firebase-uid' });
      expect(user?.email).toBe('test@example.com');
    });

    it('should return existing user if firebaseUid already exists', async () => {
      // Create a user first
      await User.create({
        firebaseUid: 'test-firebase-uid',
        email: 'existing@example.com',
      });

      const userData = {
        firebaseUid: 'test-firebase-uid',
        email: 'new@example.com',
      };

      const request = createRequest({
        method: 'POST',
        body: userData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(200);
      expect(data.firebaseUid).toBe('test-firebase-uid');
      expect(data.email).toBe('existing@example.com'); // Should return existing email
    });

    it('should return 400 when firebaseUid is missing', async () => {
      const userData = {
        email: 'test@example.com',
      };

      const request = createRequest({
        method: 'POST',
        body: userData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(400);
      expect(data.error).toBe('Firebase UID and email are required');
      expect(data.errorId).toBeDefined();
    });

    it('should return 400 when email is missing', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid',
      };

      const request = createRequest({
        method: 'POST',
        body: userData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(400);
      expect(data.error).toBe('Firebase UID and email are required');
      expect(data.errorId).toBeDefined();
    });

    it('should return 400 when both fields are missing', async () => {
      const userData = {};

      const request = createRequest({
        method: 'POST',
        body: userData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(400);
      expect(data.error).toBe('Firebase UID and email are required');
    });

    it('should return 409 when email already exists with different firebaseUid', async () => {
      // Create a user with the same email
      await User.create({
        firebaseUid: 'existing-firebase-uid',
        email: 'test@example.com',
      });

      const userData = {
        firebaseUid: 'new-firebase-uid',
        email: 'test@example.com',
      };

      const request = createRequest({
        method: 'POST',
        body: userData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(409);
      expect(data.error).toBe('A user with this email already exists');
      expect(data.errorId).toBeDefined();
    });

    it('should return 500 on database error', async () => {
      // Mock User.create to throw an error
      jest.spyOn(User, 'create').mockRejectedValue(new Error('Database error'));

      const userData = {
        firebaseUid: 'test-firebase-uid',
        email: 'test@example.com',
      };

      const request = createRequest({
        method: 'POST',
        body: userData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(500);
      expect(data.error).toBe('Failed to create user');
      expect(data.errorId).toBeDefined();

      // Restore the mock
      jest.restoreAllMocks();
    });
  });
});
