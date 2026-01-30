/**
 * End-to-End API Test: Keyword Creation → Prompt Creation → LLM Execution
 *
 * This test verifies the complete flow with REAL OpenRouter API calls:
 * 1. Create a keyword via API
 * 2. Create a prompt via API
 * 3. Execute the prompt with 3 Gemini models via OpenRouter
 * 4. Verify results are saved correctly
 *
 * ⚠️ WARNING: This test makes REAL API calls and will incur actual costs.
 *
 * SETUP REQUIRED:
 * 1. Add your REAL OpenRouter API key to .env.local:
 *    OPENROUTER_API_KEY=sk-or-v1-your-real-key-here
 * 2. Ensure your OpenRouter account has sufficient credits
 *
 * Run with: npm test -- e2e-keyword-prompt-llm-real-api.test.ts
 *
 * See: __tests__/api/README-E2E-TEST.md for detailed documentation
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually BEFORE jest.setup.js runs
const envLocalPath = resolve('.env.local');
try {
  const envContent = readFileSync(envLocalPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#') && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      process.env[key.trim()] = cleanValue;
    }
  });
  console.log('✅ Loaded .env.local for real API test');
} catch (error) {
  throw new Error(
    `Failed to load .env.local: ${error.message}\n` +
    'Please ensure .env.local exists with OPENROUTER_API_KEY set\n' +
    'See: __tests__/api/README-E2E-TEST.md for setup instructions'
  );
}

import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';
import User from '@/models/User';
import Keyword from '@/models/Keyword';
import Prompt from '@/models/Prompt';
import Result from '@/models/Result';
import { POST } from '@/app/api/keywords/route';
import { POST as PROMPT_POST } from '@/app/api/prompts/route';
import { POST as EXECUTE_POST } from '@/app/api/execute/route';
import { AVAILABLE_MODELS } from '@/lib/openrouter';
import { NextRequest } from 'next/server';

// Reload serverEnv after .env.local is loaded
import { serverEnv } from '@/lib/env';
Object.assign(serverEnv, {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
});

// Verify we have a real API key (not the test one)
console.log('🔑 API Key check:', {
  hasKey: !!process.env.OPENROUTER_API_KEY,
  keyPrefix: process.env.OPENROUTER_API_KEY?.substring(0, 10) + '...',
  isTestKey: process.env.OPENROUTER_API_KEY === 'test-openrouter-key',
  serverEnvPrefix: serverEnv.OPENROUTER_API_KEY?.substring(0, 10) + '...',
});

if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'test-openrouter-key') {
  throw new Error(
    'REAL OpenRouter API key not found! Please add OPENROUTER_API_KEY to .env.local\n' +
    'See: __tests__/api/README-E2E-TEST.md for setup instructions'
  );
}

// NOTE: Mock disabled - using real OpenRouter API calls
// Only the AVAILABLE_MODELS array is used from the module

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

describe('E2E: Keyword → Prompt → LLM Execution (REAL OpenRouter API)', () => {
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
  });

  it('should create keyword, create prompt, and execute with 3 Gemini models via OpenRouter', async () => {
    // ============================================================
    // STEP 1: Filter and select 3 Gemini models
    // ============================================================
    const geminiModels = AVAILABLE_MODELS.filter(m => m.id.includes('google/gemini'));

    if (geminiModels.length < 3) {
      throw new Error(`Need at least 3 Gemini models, but only found ${geminiModels.length}`);
    }

    // Shuffle and pick 3
    const shuffled = [...geminiModels].sort(() => Math.random() - 0.5);
    const [primaryModel, ...comparisonModels] = shuffled.slice(0, 3);

    console.log('\n📊 Selected Gemini LLM Models:');
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
    // STEP 4: Execute prompt with 3 Gemini LLMs (REAL API CALLS)
    // ============================================================
    console.log('\n🌐 Making REAL OpenRouter API calls...');
    console.log('   This will incur actual costs!\n');

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
    // STEP 5: Verify each LLM response (REAL RESPONSES)
    // ============================================================
    const expectedModels = [primaryModel.id, comparisonModels[0].id, comparisonModels[1].id];

    executeData.results.forEach((result: any, index: number) => {
      expect(result.llmModel).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.response).toBeTruthy();  // Real response should not be empty
      expect(result.response.length).toBeGreaterThan(50);  // Real responses are longer
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
    console.log('\n✅ All assertions passed! Real API calls completed successfully.');
    console.log('💰 Note: This test made REAL OpenRouter API calls and incurred actual costs.\n');
  });
});
