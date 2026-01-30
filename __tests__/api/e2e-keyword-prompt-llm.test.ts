/**
 * End-to-End API Test: Keyword Creation → Prompt Creation → LLM Execution
 *
 * This test verifies the complete flow with MOCKED OpenRouter API calls:
 * 1. Create a keyword via API
 * 2. Create a prompt via API
 * 3. Execute the prompt with 3 random LLM models
 * 4. Verify results are saved correctly
 *
 * NOTE: This test uses MOCKED responses - no real API calls are made.
 * Fast and free - suitable for CI/CD and development.
 *
 * For real API calls, see: e2e-keyword-prompt-llm-real-api.test.ts
 */

import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Keyword from '@/models/Keyword';
import Prompt from '@/models/Prompt';
import Result from '@/models/Result';
import { POST } from '@/app/api/keywords/route';
import { POST as PROMPT_POST } from '@/app/api/prompts/route';
import { POST as EXECUTE_POST } from '@/app/api/execute/route';
import { AVAILABLE_MODELS, executePromptNonStreaming } from '@/lib/openrouter';
import { NextRequest } from 'next/server';

// Mock the OpenRouter module to avoid real API calls
jest.mock('@/lib/openrouter', () => ({
  AVAILABLE_MODELS: [
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp' },
    { id: 'google/gemini-flash', name: 'Gemini Flash' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  ],
  executePromptNonStreaming: jest.fn(),
}));

// Mock implementation for executePromptNonStreaming
const mockExecutePromptNonStreaming = executePromptNonStreaming as jest.MockedFunction<typeof executePromptNonStreaming>;

/**
 * Helper function to create a mock NextRequest
 */
function createMockRequest(body: any, firebaseUid: string): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: (name: string) => {
        if (name === 'x-firebase-uid') return firebaseUid;
        return null;
      },
    },
  } as unknown as NextRequest;
}

describe('E2E: Keyword → Prompt → LLM Execution (MOCKED)', () => {
  let testUser: any;
  let firebaseUid: string;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    // Close MongoDB connection to prevent hanging
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test user for authentication
    firebaseUid = 'test-firebase-uid-' + Math.random().toString(36).substring(7);
    testUser = await User.create({
      firebaseUid,
      email: `test-${Math.random()}@example.com`,
    });

    // Setup mock implementation for each test
    mockExecutePromptNonStreaming.mockImplementation((model: string, prompt: string) => {
      return Promise.resolve({
        text: `This is a mocked response from ${model}. The prompt was: "${prompt.substring(0, 50)}..."`,
        usage: { promptTokens: 10, completionTokens: 20 },
        finishReason: 'stop',
      });
    });
  });

  it('should create keyword, create prompt, and execute with 3 random LLM models', async () => {
    // ============================================================
    // STEP 1: Select 3 random LLM models
    // ============================================================
    const shuffled = [...AVAILABLE_MODELS].sort(() => Math.random() - 0.5);
    const [primaryModel, ...comparisonModels] = shuffled.slice(0, 3);

    console.log('\n📊 Selected LLM Models (MOCKED):');
    console.log(`  Primary: ${primaryModel.name} (${primaryModel.id})`);
    console.log(`  Comparison 1: ${comparisonModels[0].name} (${comparisonModels[0].id})`);
    console.log(`  Comparison 2: ${comparisonModels[1].name} (${comparisonModels[1].id})`);

    // ============================================================
    // STEP 2: Create a keyword
    // ============================================================
    const keywordRequest = createMockRequest(
      { name: 'artificial-intelligence' },
      firebaseUid
    );

    const keywordResponse = await POST(keywordRequest);

    expect(keywordResponse.status).toBe(201);

    const keywordData = await keywordResponse.json();
    expect(keywordData.name).toBe('artificial-intelligence');
    expect(keywordData._id).toBeDefined();

    const keywordId = keywordData._id;
    console.log('\n✅ Keyword created:');
    console.log(`  ID: ${keywordId}`);
    console.log(`  Name: ${keywordData.name}`);

    // ============================================================
    // STEP 3: Create a prompt
    // ============================================================
    const promptRequest = createMockRequest(
      {
        title: 'E2E Test Prompt',
        content: 'What is artificial intelligence and how does it work?',
      },
      firebaseUid
    );

    const promptResponse = await PROMPT_POST(promptRequest);

    expect(promptResponse.status).toBe(201);

    const promptData = await promptResponse.json();
    expect(promptData.title).toBe('E2E Test Prompt');
    expect(promptData.content).toBe('What is artificial intelligence and how does it work?');
    expect(promptData._id).toBeDefined();

    const promptId = promptData._id;
    console.log('\n✅ Prompt created:');
    console.log(`  ID: ${promptId}`);
    console.log(`  Title: ${promptData.title}`);
    console.log(`  Content: ${promptData.content}`);

    // ============================================================
    // STEP 4: Execute prompt with 3 LLMs (MOCKED)
    // ============================================================
    const executeRequest = createMockRequest(
      {
        promptId,
        llmModel: primaryModel.id,
        comparisonModels: [comparisonModels[0].id, comparisonModels[1].id],
      },
      firebaseUid
    );

    const executeResponse = await EXECUTE_POST(executeRequest);

    expect(executeResponse.status).toBe(201);

    const executeData = await executeResponse.json();
    expect(executeData.results).toBeDefined();
    expect(executeData.results).toHaveLength(3);

    console.log('\n✅ Execution completed:');
    console.log(`  Total results: ${executeData.results.length}`);

    // ============================================================
    // STEP 5: Verify each LLM response (MOCKED RESPONSES)
    // ============================================================
    const expectedModels = [primaryModel.id, comparisonModels[0].id, comparisonModels[1].id];

    executeData.results.forEach((result: any, index: number) => {
      expect(result.llmModel).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.response).toBeTruthy();  // Mocked response should not be empty
      expect(result._id).toBeDefined();

      console.log(`\n  Result ${index + 1}:`);
      console.log(`    Model: ${result.llmModel}`);
      console.log(`    Response ID: ${result._id}`);
      console.log(`    Response length: ${result.response.length} chars`);
      console.log(`    Response preview: ${result.response.substring(0, 150)}...`);
    });

    // ============================================================
    // STEP 6: Verify database state
    // ============================================================
    const resultsInDb = await Result.find({ user: testUser._id });
    expect(resultsInDb).toHaveLength(3);

    console.log('\n✅ Database verification:');
    console.log(`  User ID: ${testUser._id}`);
    console.log(`  Results in database: ${resultsInDb.length}`);
    console.log(`  Firebase UID: ${firebaseUid}`);

    resultsInDb.forEach((result, index) => {
      console.log(`\n  Result ${index + 1} in DB:`);
      console.log(`    ID: ${result._id}`);
      console.log(`    Model: ${result.llmModel}`);
      console.log(`    Has response: ${!!result.response}`);
      console.log(`    Response length: ${result.response?.length || 0} chars`);
    });

    // Verify keyword still exists
    const keywordInDb = await Keyword.findById(keywordId);
    expect(keywordInDb).toBeDefined();
    expect(keywordInDb?.name).toBe('artificial-intelligence');

    // Verify prompt still exists
    const promptInDb = await Prompt.findById(promptId);
    expect(promptInDb).toBeDefined();
    expect(promptInDb?.title).toBe('E2E Test Prompt');

    console.log('\n📋 Test Data Summary (for manual inspection):');
    console.log(`  User ID: ${testUser._id}`);
    console.log(`  Keyword ID: ${keywordId}`);
    console.log(`  Prompt ID: ${promptId}`);
    console.log(`  Result IDs: ${resultsInDb.map(r => r._id).join(', ')}`);
    console.log(`  Models used: ${resultsInDb.map(r => r.llmModel).join(', ')}`);
    console.log('\n✅ All assertions passed! Mocked API calls completed successfully.');
    console.log('💡 Note: This test used MOCKED responses - no real API calls were made.\n');
  });
});
