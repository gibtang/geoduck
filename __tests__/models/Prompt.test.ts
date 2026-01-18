import mongoose from 'mongoose';
import Prompt from '@/models/Prompt';
import User from '@/models/User';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';

describe('Prompt Model', () => {
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

  it('should create a prompt with valid data', async () => {
    const promptData = {
      title: 'Test Prompt',
      content: 'What are the best products?',
      category: 'Product Discovery',
      user: userId,
    };

    const prompt = await Prompt.create(promptData);

    expect(prompt.title).toBe(promptData.title);
    expect(prompt.content).toBe(promptData.content);
    expect(prompt.category).toBe(promptData.category);
    expect(prompt.user).toEqual(userId);
    expect(prompt.createdAt).toBeDefined();
    expect(prompt.updatedAt).toBeDefined();
  });

  it('should fail to create prompt without required fields', async () => {
    const promptData = {
      title: 'Test Prompt',
    };

    await expect(Prompt.create(promptData)).rejects.toThrow();
  });

  it('should update prompt', async () => {
    const prompt = await Prompt.create({
      title: 'Original Title',
      content: 'Original content',
      category: 'Original Category',
      user: userId,
    });

    prompt.title = 'Updated Title';
    prompt.content = 'Updated content';
    await prompt.save();

    const updatedPrompt = await Prompt.findById(prompt._id);
    expect(updatedPrompt?.title).toBe('Updated Title');
    expect(updatedPrompt?.content).toBe('Updated content');
  });

  it('should find prompts by user', async () => {
    await Prompt.create({
      title: 'Prompt 1',
      content: 'Content 1',
      category: 'Category 1',
      user: userId,
    });

    await Prompt.create({
      title: 'Prompt 2',
      content: 'Content 2',
      category: 'Category 2',
      user: userId,
    });

    const prompts = await Prompt.find({ user: userId });

    expect(prompts).toHaveLength(2);
  });

  it('should delete prompt', async () => {
    const prompt = await Prompt.create({
      title: 'Test Prompt',
      content: 'Test content',
      category: 'Test Category',
      user: userId,
    });

    await Prompt.findByIdAndDelete(prompt._id);

    const deletedPrompt = await Prompt.findById(prompt._id);
    expect(deletedPrompt).toBeNull();
  });

  it('should sort prompts by creation date', async () => {
    await Prompt.create({
      title: 'First Prompt',
      content: 'First content',
      category: 'Category',
      user: userId,
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    await Prompt.create({
      title: 'Second Prompt',
      content: 'Second content',
      category: 'Category',
      user: userId,
    });

    const prompts = await Prompt.find({ user: userId }).sort({ createdAt: -1 });

    expect(prompts[0].title).toBe('Second Prompt');
    expect(prompts[1].title).toBe('First Prompt');
  });
});
