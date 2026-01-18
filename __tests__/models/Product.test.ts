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
      category: 'Electronics',
      price: 99.99,
      keywords: ['test', 'sample'],
      user: userId,
    };

    const product = await Product.create(productData);

    expect(product.name).toBe(productData.name);
    expect(product.description).toBe(productData.description);
    expect(product.category).toBe(productData.category);
    expect(product.price).toBe(productData.price);
    expect(product.keywords).toEqual(expect.arrayContaining(productData.keywords));
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

  it('should fail to create product with negative price', async () => {
    const productData = {
      name: 'Test Product',
      description: 'A great test product',
      category: 'Electronics',
      price: -10,
      user: userId,
    };

    await expect(Product.create(productData)).rejects.toThrow();
  });

  it('should create product with empty keywords array', async () => {
    const productData = {
      name: 'Test Product',
      description: 'A great test product',
      category: 'Electronics',
      price: 99.99,
      keywords: [],
      user: userId,
    };

    const product = await Product.create(productData);

    expect(product.keywords).toEqual([]);
  });

  it('should update product', async () => {
    const product = await Product.create({
      name: 'Test Product',
      description: 'A great test product',
      category: 'Electronics',
      price: 99.99,
      user: userId,
    });

    product.name = 'Updated Product';
    product.price = 149.99;
    await product.save();

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct?.name).toBe('Updated Product');
    expect(updatedProduct?.price).toBe(149.99);
  });

  it('should find products by user', async () => {
    await Product.create({
      name: 'Product 1',
      description: 'Description 1',
      category: 'Category 1',
      price: 10,
      user: userId,
    });

    await Product.create({
      name: 'Product 2',
      description: 'Description 2',
      category: 'Category 2',
      price: 20,
      user: userId,
    });

    const products = await Product.find({ user: userId });

    expect(products).toHaveLength(2);
  });

  it('should delete product', async () => {
    const product = await Product.create({
      name: 'Test Product',
      description: 'A great test product',
      category: 'Electronics',
      price: 99.99,
      user: userId,
    });

    await Product.findByIdAndDelete(product._id);

    const deletedProduct = await Product.findById(product._id);
    expect(deletedProduct).toBeNull();
  });
});
