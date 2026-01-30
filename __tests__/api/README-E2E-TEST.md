# End-to-End API Tests

This directory contains two end-to-end tests for the keyword → prompt → LLM execution flow:

## Available Tests

### 1. Mocked Test (Fast & Free)
**File**: `e2e-keyword-prompt-llm.test.ts`

- ✅ **No API costs** - uses mocked responses
- ✅ **Fast execution** - runs in < 1 second
- ✅ **CI/CD friendly** - suitable for automated testing
- ✅ **Random LLM selection** - tests with any 3 models from the available list

**Command**:
```bash
npm test -- e2e-keyword-prompt-llm.test.ts
```

### 2. Real API Test (Actual Costs)
**File**: `e2e-keyword-prompt-llm-real-api.test.ts`

- ⚠️ **Real API costs** - makes actual OpenRouter API calls
- ⚠️ **Slower execution** - depends on API response time
- ✅ **Gemini models only** - tests with real Gemini responses
- ✅ **Manual testing** - for verifying actual OpenRouter integration

**Command**:
```bash
npm test -- e2e-keyword-prompt-llm-real-api.test.ts
```

---

## Real API Test Setup

### Prerequisites

1. **OpenRouter API Key**: You must have a valid OpenRouter API key
2. **Sufficient Credits**: Ensure your OpenRouter account has enough credits
3. **Environment Variable**: Set your API key in `.env.local`

### Setup Steps

#### 1. Create or update `.env.local`:

```bash
# Add your REAL OpenRouter API key
OPENROUTER_API_KEY=sk-or-v1-your-real-key-here
```

**⚠️ IMPORTANT**: Do NOT commit your real API key to git!

#### 2. Run the real API test:

```bash
npm test -- e2e-keyword-prompt-llm-real-api.test.ts
```

---

## What These Tests Do

### Mocked Test (`e2e-keyword-prompt-llm.test.ts`)
1. ✅ Creates a keyword in the test database
2. ✅ Creates a prompt in the test database
3. ✅ Executes the prompt with **3 random LLM models** (mocked)
4. ✅ Uses mocked responses (no API calls)
5. ✅ Saves all 3 responses to the database
6. ✅ Verifies data persistence

### Real API Test (`e2e-keyword-prompt-llm-real-api.test.ts`)
1. ✅ Creates a keyword in the test database
2. ✅ Creates a prompt in the test database
3. ✅ Executes the prompt with **3 Gemini models** via OpenRouter:
   - Gemini 2.5 Flash
   - Gemini 2.0 Flash Exp
   - Gemini Flash
   - (Randomly selects 3 out of the 3 available Gemini models)
4. ✅ Makes **3 REAL API calls** to OpenRouter
5. ✅ Saves all 3 responses to the database
6. ✅ Verifies data persistence

---

## Costs

### Mocked Test
- **$0.00** - No API costs
- Fast and suitable for frequent development

### Real API Test
- **3 API calls** per test run
- Cost depends on the Gemini models selected
- Typically: **$0.001 - $0.01** per run (varies by model and response length)

---

## Expected Output

### Mocked Test Output:
```
📊 Selected LLM Models (MOCKED):
  Primary: Gemini Flash (google/gemini-flash)
  Comparison 1: GPT-4o (openai/gpt-4o)
  Comparison 2: Claude 3.5 Sonnet (anthropic/claude-3.5-sonnet)

✅ Keyword created:
  ID: 697c28f8c2b5e13585319c2d
  Name: artificial-intelligence

✅ Execution completed:
  Total results: 3

✅ All assertions passed! Mocked API calls completed successfully.
💡 Note: This test used MOCKED responses - no real API calls were made.
```

### Real API Test Output:
```
📊 Selected Gemini LLM Models:
  Primary: Gemini 2.0 Flash Exp (google/gemini-2.0-flash-exp)
  Comparison 1: Gemini Flash (google/gemini-flash)
  Comparison 2: Gemini 2.5 Flash (google/gemini-2.5-flash)

✅ Keyword created:
  ID: 697c28f8c2b5e13585319c2d
  Name: artificial-intelligence

✅ Execution completed:
  Total results: 3

✅ All assertions passed! Real API calls completed successfully.
💰 Note: This test made REAL OpenRouter API calls and incurred actual costs.
```

---

## Quick Reference

| Test | Command | Cost | Speed | Use Case |
|------|---------|------|-------|----------|
| **Mocked** | `npm test -- e2e-keyword-prompt-llm.test.ts` | Free | < 1s | Development, CI/CD |
| **Real API** | `npm test -- e2e-keyword-prompt-llm-real-api.test.ts` | $0.001-0.01 | 5-30s | Manual testing, integration verification |

---

## Troubleshooting

### Error: "No cookie auth credentials found" (Real API Test Only)

**Cause**: Missing or invalid OpenRouter API key

**Solution**:
1. Check that `.env.local` exists
2. Verify `OPENROUTER_API_KEY` is set correctly
3. Ensure the API key is valid (not expired, has credits)
4. Check that you're running the **real API test**, not the mocked one

### Error: "Need at least 3 Gemini models, but only found X" (Real API Test Only)

**Cause**: Not enough Gemini models available in `lib/openrouter.ts`

**Solution**: Add more Gemini models to `lib/openrouter.ts`:

```typescript
export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp' },
  { id: 'google/gemini-flash', name: 'Gemini Flash' },
  // Add more as needed...
];
```

### Error: 500 Status / "Failed to execute prompt" (Real API Test Only)

**Cause**: API key has no credits or API is down

**Solution**: Check your OpenRouter account balance at https://openrouter.ai/keys

---

## Best Practices

### Development
- Use the **mocked test** for rapid development iterations
- Run the mocked test frequently to catch regressions
- No setup required - works out of the box

### Integration Testing
- Use the **real API test** before deploying to production
- Verify actual OpenRouter integration works correctly
- Test with real Gemini model responses

### CI/CD Pipelines
- **ONLY** use the mocked test in CI/CD
- **NEVER** add real API keys to CI/CD environment
- Real API tests should be run manually only
