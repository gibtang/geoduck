import mongoose from 'mongoose';
import Keyword from '@/models/Keyword';
import User from '@/models/User';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';

describe('Keyword Model', () => {
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

  it('should create a keyword with valid data', async () => {
    const keywordData = {
      name: 'Test Keyword',
      user: userId,
    };

    const keyword = await Keyword.create(keywordData);

    expect(keyword.name).toBe(keywordData.name);
    expect(keyword.user).toEqual(userId);
    expect(keyword.createdAt).toBeDefined();
    expect(keyword.updatedAt).toBeDefined();
  });

  it('should fail to create keyword without required fields', async () => {
    const keywordData = {
      name: 'Test Keyword',
    };

    await expect(Keyword.create(keywordData)).rejects.toThrow();
  });

  it('should fail to create keyword without name', async () => {
    const keywordData = {
      user: userId,
    };

    await expect(Keyword.create(keywordData)).rejects.toThrow();
  });

  it('should update keyword', async () => {
    const keyword = await Keyword.create({
      name: 'Test Keyword',
      user: userId,
    });

    keyword.name = 'Updated Keyword';
    await keyword.save();

    const updatedKeyword = await Keyword.findById(keyword._id);
    expect(updatedKeyword?.name).toBe('Updated Keyword');
  });

  it('should find keywords by user', async () => {
    await Keyword.create({
      name: 'Keyword 1',
      user: userId,
    });

    await Keyword.create({
      name: 'Keyword 2',
      user: userId,
    });

    const keywords = await Keyword.find({ user: userId });

    expect(keywords).toHaveLength(2);
  });

  it('should delete keyword', async () => {
    const keyword = await Keyword.create({
      name: 'Test Keyword',
      user: userId,
    });

    await Keyword.findByIdAndDelete(keyword._id);

    const deletedKeyword = await Keyword.findById(keyword._id);
    expect(deletedKeyword).toBeNull();
  });
});
