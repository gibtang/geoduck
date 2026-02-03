import { GET, POST } from '@/app/api/prompts/route';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Prompt from '@/models/Prompt';
import { NextRequest } from 'next/server';

// Mock the database connection to avoid reconnecting with different URI
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

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
        user: userId,
      });

      await Prompt.create({
        title: 'Prompt 2',
        content: 'Content 2',
        user: userId,
      });

      const request = {
        headers: {
          get: (name: string) => (name === 'x-firebase-uid' ? firebaseUid : null),
        },
      } as unknown as NextRequest;

      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveLength(2);
      // Prompts are sorted by createdAt descending, so Prompt 2 (newer) comes first
      expect(data[0].title).toBe('Prompt 2');
      expect(data[1].title).toBe('Prompt 1');
    });

    it('should return empty array for user with no prompts', async () => {
      const request = {
        headers: {
          get: (name: string) => (name === 'x-firebase-uid' ? firebaseUid : null),
        },
      } as unknown as NextRequest;

      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual([]);
    });

    it('should return 401 without firebase uid', async () => {
      const request = {
        headers: {
          get: (name: string) => null,
        },
      } as unknown as NextRequest;

      const response = await GET(request);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/prompts', () => {
    it('should create a new prompt', async () => {
      const promptData = {
        title: 'New Prompt',
        content: 'What are the best keywords?',
      };

      const request = {
        headers: {
          get: (name: string) => (name === 'x-firebase-uid' ? firebaseUid : null),
        },
        json: async () => promptData,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.title).toBe(promptData.title);
      expect(data.content).toBe(promptData.content);
    });

    it('should return 400 with missing required fields', async () => {
      const promptData = {
        title: 'New Prompt',
      };

      const request = {
        headers: {
          get: (name: string) => (name === 'x-firebase-uid' ? firebaseUid : null),
        },
        json: async () => promptData,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 401 without firebase uid', async () => {
      const promptData = {
        title: 'New Prompt',
        content: 'Content',
      };

      const request = {
        headers: {
          get: (name: string) => null,
        },
        json: async () => promptData,
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });
});
