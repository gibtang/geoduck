import mongoose from 'mongoose';
import Product from '@/models/Product';
import User from '@/models/User';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';

describe('Product Model', () => {
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    const user = await User.create({
      firebaseUid: 'test-uid-123',
      email: 'test@example.com',
    });
    userId = user._id;
  });

  it('should create a product with valid data', async () => {
    const productData = {
      name: 'Test Product',
      description: 'A great test product',
      user: userId,
    };

    const product = await Product.create(productData);

    expect(product.name).toBe(productData.name);
    expect(product.description).toBe(productData.description);
    expect(product.user).toEqual(userId);
    expect(product.createdAt).toBeDefined();
    expect(product.updatedAt).toBeDefined();
  });

  it('should fail to create product without required fields', async () => {
    const productData = {
      name: 'Test Product',
    };

    await expect(Product.create(productData)).rejects.toThrow();
  });

  it('should create product with optional description', async () => {
    const productData = {
      name: 'Test Product',
      user: userId,
    };

    const product = await Product.create(productData);

    expect(product.name).toBe(productData.name);
    expect(product.description).toBeUndefined();
    expect(product.user).toEqual(userId);
  });

  it('should update product', async () => {
    const product = await Product.create({
      name: 'Test Product',
      description: 'A great test product',
      user: userId,
    });

    product.name = 'Updated Product';
    product.description = 'Updated description';
    await product.save();

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct?.name).toBe('Updated Product');
    expect(updatedProduct?.description).toBe('Updated description');
  });

  it('should find products by user', async () => {
    await Product.create({
      name: 'Product 1',
      description: 'Description 1',
      user: userId,
    });

    await Product.create({
      name: 'Product 2',
      description: 'Description 2',
      user: userId,
    });

    const products = await Product.find({ user: userId });

    expect(products).toHaveLength(2);
  });

  it('should delete product', async () => {
    const product = await Product.create({
      name: 'Test Product',
      description: 'A great test product',
      user: userId,
    });

    await Product.findByIdAndDelete(product._id);

    const deletedProduct = await Product.findById(product._id);
    expect(deletedProduct).toBeNull();
  });
});
