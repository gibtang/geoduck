import mongoose from 'mongoose';
import Result from '@/models/Result';
import Prompt from '@/models/Prompt';
import Keyword from '@/models/Keyword';
import User from '@/models/User';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';

describe('Result Model', () => {
  let userId: mongoose.Types.ObjectId;
  let keywordId: mongoose.Types.ObjectId;
  let promptId: mongoose.Types.ObjectId;

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

    const keyword = await Keyword.create({
      name: 'Test Keyword',
      description: 'A test keyword',
      category: 'Test',
      price: 99.99,
      keywords: ['test'],
      user: userId,
    });
    keywordId = keyword._id;

    const prompt = await Prompt.create({
      title: 'Test Prompt',
      content: 'Test prompt content',
      user: userId,
    });
    promptId = prompt._id;
  });

  it('should create a result with prompt reference', async () => {
    const resultData = {
      prompt: promptId,
      llmModel: 'gemini-2.0-flash',
      response: 'This is a test response',
      keywordsMentioned: [
        {
          keyword: keywordId,
          position: 10,
          sentiment: 'positive' as const,
          context: 'Test Keyword is great',
        },
      ],
      user: userId,
    };

    const result = await Result.create(resultData);

    expect(result.prompt).toEqual(promptId);
    expect(result.llmModel).toBe(resultData.llmModel);
    expect(result.response).toBe(resultData.response);
    expect(result.keywordsMentioned).toHaveLength(1);
    expect(result.keywordsMentioned[0].keyword).toEqual(keywordId);
    expect(result.keywordsMentioned[0].sentiment).toBe('positive');
    expect(result.createdAt).toBeDefined();
  });

  it('should create a result without prompt (custom prompt)', async () => {
    const resultData = {
      llmModel: 'gemini-2.0-flash',
      response: 'This is a test response',
      keywordsMentioned: [],
      user: userId,
    };

    const result = await Result.create(resultData);

    expect(result.prompt).toBeUndefined();
    expect(result.llmModel).toBe(resultData.llmModel);
    expect(result.keywordsMentioned).toEqual([]);
  });

  it('should fail to create result without required fields', async () => {
    const resultData = {
      response: 'Test response',
    };

    await expect(Result.create(resultData)).rejects.toThrow();
  });

  it('should validate sentiment enum', async () => {
    const resultData = {
      prompt: promptId,
      llmModel: 'gemini-2.0-flash',
      response: 'Test response',
      keywordsMentioned: [
        {
          keyword: keywordId,
          position: 10,
          sentiment: 'invalid' as any,
          context: 'Test context',
        },
      ],
      user: userId,
    };

    await expect(Result.create(resultData)).rejects.toThrow();
  });

  it('should accept valid sentiment values', async () => {
    const sentiments: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'negative'];

    for (const sentiment of sentiments) {
      const result = await Result.create({
        prompt: promptId,
        llmModel: 'gemini-2.0-flash',
        response: 'Test response',
        keywordsMentioned: [
          {
            keyword: keywordId,
            position: 10,
            sentiment,
            context: 'Test context',
          },
        ],
        user: userId,
      });

      expect(result.keywordsMentioned[0].sentiment).toBe(sentiment);
    }
  });

  it('should store multiple keyword mentions', async () => {
    const keyword2 = await Keyword.create({
      name: 'Keyword 2',
      description: 'Second keyword',
      category: 'Test',
      price: 49.99,
      keywords: ['test2'],
      user: userId,
    });

    const result = await Result.create({
      prompt: promptId,
      llmModel: 'gemini-2.0-flash',
      response: 'Test response',
      keywordsMentioned: [
        {
          keyword: keywordId,
          position: 10,
          sentiment: 'positive',
          context: 'Test Keyword is great',
        },
        {
          keyword: keyword2._id,
          position: 50,
          sentiment: 'neutral',
          context: 'Keyword 2 is okay',
        },
      ],
      user: userId,
    });

    expect(result.keywordsMentioned).toHaveLength(2);
  });

  it('should find results by user', async () => {
    await Result.create({
      prompt: promptId,
      llmModel: 'gemini-2.0-flash',
      response: 'Response 1',
      keywordsMentioned: [],
      user: userId,
    });

    await Result.create({
      prompt: promptId,
      llmModel: 'gpt-4o',
      response: 'Response 2',
      keywordsMentioned: [],
      user: userId,
    });

    const results = await Result.find({ user: userId });

    expect(results).toHaveLength(2);
  });

  it('should find results by model', async () => {
    await Result.create({
      prompt: promptId,
      llmModel: 'gemini-2.0-flash',
      response: 'Response 1',
      keywordsMentioned: [],
      user: userId,
    });

    await Result.create({
      prompt: promptId,
      llmModel: 'gpt-4o',
      response: 'Response 2',
      keywordsMentioned: [],
      user: userId,
    });

    const geminiResults = await Result.find({ user: userId, llmModel: 'gemini-2.0-flash' });

    expect(geminiResults).toHaveLength(1);
    expect(geminiResults[0].llmModel).toBe('gemini-2.0-flash');
  });

  it('should populate prompt and keyword references', async () => {
    const result = await Result.create({
      prompt: promptId,
      llmModel: 'gemini-2.0-flash',
      response: 'Test response',
      keywordsMentioned: [
        {
          keyword: keywordId,
          position: 10,
          sentiment: 'positive',
          context: 'Test Keyword is great',
        },
      ],
      user: userId,
    });

    const populatedResult = await Result.findById(result._id)
      .populate('prompt')
      .populate('keywordsMentioned.keyword');

    expect(populatedResult?.prompt).toBeDefined();
    expect((populatedResult?.prompt as any).title).toBe('Test Prompt');
    expect((populatedResult?.keywordsMentioned[0].keyword as any).name).toBe('Test Keyword');
  });

  it('should sort results by creation date', async () => {
    await Result.create({
      prompt: promptId,
      llmModel: 'gemini-2.0-flash',
      response: 'First response',
      keywordsMentioned: [],
      user: userId,
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    await Result.create({
      prompt: promptId,
      llmModel: 'gemini-2.0-flash',
      response: 'Second response',
      keywordsMentioned: [],
      user: userId,
    });

    const results = await Result.find({ user: userId }).sort({ createdAt: -1 });

    expect(results[0].response).toBe('Second response');
    expect(results[1].response).toBe('First response');
  });
});
