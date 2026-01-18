import { createRequest, createResponse } from 'node-mocks-http';
import { GET, POST } from '@/app/api/products/route';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';

describe('Products API', () => {
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

  describe('GET /api/products', () => {
    it('should return user products', async () => {
      await Product.create({
        name: 'Product 1',
        description: 'Description 1',
        category: 'Category 1',
        price: 99.99,
        user: userId,
      });

      await Product.create({
        name: 'Product 2',
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
      expect(data[0].name).toBe('Product 1');
      expect(data[1].name).toBe('Product 2');
    });

    it('should return empty array for user with no products', async () => {
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

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        description: 'New product description',
        category: 'Electronics',
        price: 299.99,
        keywords: ['test', 'new'],
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: productData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(201);
      expect(data.name).toBe(productData.name);
      expect(data.description).toBe(productData.description);
      expect(data.category).toBe(productData.category);
      expect(data.price).toBe(productData.price);
      expect(data.keywords).toEqual(productData.keywords);
    });

    it('should create product without keywords', async () => {
      const productData = {
        name: 'New Product',
        description: 'New product description',
        category: 'Electronics',
        price: 299.99,
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: productData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(201);
      expect(data.keywords).toEqual([]);
    });

    it('should return 400 with missing required fields', async () => {
      const productData = {
        name: 'New Product',
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': firebaseUid,
        },
        body: productData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 401 without firebase uid', async () => {
      const productData = {
        name: 'New Product',
        description: 'Description',
        category: 'Category',
        price: 99.99,
      };

      const request = createRequest({
        method: 'POST',
        headers: {},
        body: productData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent user', async () => {
      const productData = {
        name: 'New Product',
        description: 'Description',
        category: 'Category',
        price: 99.99,
      };

      const request = createRequest({
        method: 'POST',
        headers: {
          'x-firebase-uid': 'non-existent-uid',
        },
        body: productData,
      });

      const response = createResponse();

      await POST(request as any, response as any);

      const data = JSON.parse(response._getData());

      expect(response._getStatusCode()).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });
});
