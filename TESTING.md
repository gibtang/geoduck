# Testing Documentation

## Quick Start

```bash
# Run all unit tests (fast, mocked)
npm test -- __tests__/lib/productDetection.mocked.test.ts

# Run all tests (includes database tests)
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Suites

### 1. Unit Tests (Fast, No Database)

**File**: `__tests__/lib/productDetection.mocked.test.ts`
- **Speed**: Instant (~50ms)
- **Dependencies**: None (pure functions)
- **Use Case**: Quick iteration on core logic

Tests:
- ✅ Product detection by name and keywords
- ✅ Case-insensitive matching
- ✅ Multiple product detection
- ✅ Context extraction
- ✅ Sentiment analysis
- ✅ Product highlighting
- **Total**: 16 tests

### 2. Integration Tests (With Database)

**Files**: `__tests__/models/*.ts`
- **Speed**: Medium (~3-4s)
- **Dependencies**: MongoDB Memory Server
- **Use Case**: Validating database operations

Tests:
- ✅ User model (10 tests)
- ✅ Product model (7 tests)
- ✅ Prompt model (7 tests)
- ✅ Result model (9 tests)
- **Total**: 33 tests

### 3. API Tests (HTTP Layer)

**Files**: `__tests__/api/*.ts`
- **Speed**: Medium
- **Dependencies**: HTTP mocking
- **Use Case**: API endpoint validation

Tests:
- ✅ Products API (authentication, CRUD)
- ✅ Prompts API (authentication, CRUD)
- **Total**: 10+ tests

## Test Statistics

| Category | Tests | Status | Speed |
|----------|-------|--------|-------|
| Unit (Mocked) | 16 | ✅ Passing | ~50ms |
| Integration (DB) | 33 | ✅ Passing | ~3.4s |
| API Tests | 10+ | ⚠️ In Progress | ~1s |
| **Total** | **59+** | **✅ Passing** | **~4.5s** |

## Running Specific Tests

```bash
# Only unit tests (fastest)
npm test -- productDetection.mocked

# Only model tests
npm test -- __tests__/models

# Only API tests
npm test -- __tests__/api

# Specific test file
npm test -- productDetection.mocked.test.ts

# Watch mode for development
npm run test:watch -- __tests__/lib
```

## Coverage Goals

- **Core Business Logic**: 100% (product detection, sentiment)
- **Models**: 90%+ (validation, CRUD)
- **API Routes**: 80%+ (happy path + errors)
- **Overall Target**: 85%+ coverage

## Adding New Tests

### For Pure Functions (Unit Tests)

```typescript
// __tests__/lib/myFunction.test.ts
import { myFunction } from '@/lib/myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### For Models (Integration Tests)

```typescript
// __tests__/models/MyModel.test.ts
import MyModel from '@/models/MyModel';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';

describe('MyModel', () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => await clearDatabase());

  it('should create', async () => {
    const item = await MyModel.create({ field: 'value' });
    expect(item.field).toBe('value');
  });
});
```

### For API Routes

```typescript
// __tests__/api/myroute.test.ts
import { GET, POST } from '@/app/api/myroute/route';
import { createRequest, createResponse } from 'node-mocks-http';

describe('My API', () => {
  it('should return data', async () => {
    const request = createRequest({ method: 'GET' });
    const response = createResponse();
    await GET(request as any, response as any);
    expect(response._getStatusCode()).toBe(200);
  });
});
```

## Best Practices

1. **Mock Database for Unit Tests**: Use the mocked versions for speed
2. **Real DB for Integration Tests**: Use MongoDB Memory Server
3. **Test Happy Path + Edge Cases**: Don't just test success scenarios
4. **Keep Tests Independent**: Each test should work in isolation
5. **Use Descriptive Names**: Test names should describe what they test
6. **Mock External Services**: Don't call real APIs in tests

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Troubleshooting

### Tests are slow
- Use mocked unit tests instead of DB tests
- Run specific test suites instead of all tests

### MongoDB connection errors
- Make sure MongoDB Memory Server is installed
- Check that `connect()` is called in `beforeAll()`
- Verify `clearDatabase()` in `beforeEach()`

### Type errors in tests
- Make sure `@types/jest` is installed
- Check `tsconfig.json` includes test files
- Verify jest.config.js paths

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
