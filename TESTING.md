# 🧪 Security Testing Guide

## Overview

This project includes a comprehensive automated security test suite that verifies all security validations are working correctly.

## Quick Start

```bash
# Install dependencies (if not already installed)
npm install

# Run all security tests
npm run test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Open interactive test UI
npm run test:ui
```

## What's Being Tested

### 1. **Comment Validation** (`commentValidation.test.tsx`)
- ✅ Rejects comments < 2 characters
- ✅ Rejects comments > 1000 characters  
- ✅ Accepts valid comments (2-1000 chars)
- ✅ Trims whitespace before validation
- ✅ Shows character counter
- ✅ Zod schema validation

### 2. **Input Validation** (`inputValidation.test.ts`)
- ✅ OAuth callback parameter validation
- ✅ Authorization code validation
- ✅ Leaderboard type enum validation
- ✅ UUID format validation
- ✅ String length limits (max 1000 chars)
- ✅ SQL injection prevention
- ✅ XSS attempt handling

### 3. **Rate Limiting** (`rateLimit.test.ts`)
- ✅ Request counting per user/IP
- ✅ Time window enforcement (60 seconds)
- ✅ Independent user tracking
- ✅ Burst protection
- ✅ Rate limit reset after window expires
- ✅ Different limits for different endpoints:
  - Leaderboards: 30 requests/minute
  - OAuth: 10 requests/minute

### 4. **Integration Tests** (`integration.test.ts`)
- ✅ Defense in depth (multiple validation layers)
- ✅ Generic error messages (no info leakage)
- ✅ Authentication requirements
- ✅ Data sanitization
- ✅ Caching behavior
- ✅ Security headers

## Test Results

After running `npm run test`, you'll see output like:

```
✓ src/test/security/commentValidation.test.tsx (15 tests)
✓ src/test/security/inputValidation.test.ts (25 tests)
✓ src/test/security/rateLimit.test.ts (18 tests)
✓ src/test/security/integration.test.ts (12 tests)

Test Files  4 passed (4)
Tests  70 passed (70)
```

## Coverage Report

Run `npm run test:coverage` to generate a detailed coverage report:

```
File                              | % Stmts | % Branch | % Funcs | % Lines
----------------------------------|---------|----------|---------|--------
All files                         |   85.21 |    82.14 |   88.46 |   85.21
 components/activity              |   92.15 |    89.47 |   95.00 |   92.15
  ActivityCard.tsx                |   92.15 |    89.47 |   95.00 |   92.15
 functions/_shared                |   88.88 |    85.71 |   90.00 |   88.88
  validation.ts                   |   90.00 |    87.50 |   92.30 |   90.00
  rateLimit.ts                    |   87.50 |    83.33 |   87.50 |   87.50
```

The HTML report is saved to `coverage/index.html`.

## Continuous Integration

These tests run automatically:
- **On every commit** (via pre-commit hook - if configured)
- **On pull requests** (via CI/CD pipeline)
- **Before deployments** (mandatory pass required)

## Adding New Security Tests

When you add new security features:

1. **Create test file** in `src/test/security/`
2. **Follow naming convention**: `featureName.test.ts` or `.tsx`
3. **Import required testing utilities**:
   ```typescript
   import { describe, it, expect, vi } from 'vitest';
   ```
4. **Write test cases** for both success and failure scenarios
5. **Test edge cases**: empty strings, very long strings, special characters, etc.
6. **Update this document** with new test coverage

### Example Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('New Security Feature', () => {
  describe('Valid Inputs', () => {
    it('should accept valid input', () => {
      // Test implementation
      expect(result).toBe(true);
    });
  });

  describe('Invalid Inputs', () => {
    it('should reject invalid input', () => {
      // Test implementation
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle edge case', () => {
      // Test implementation
    });
  });
});
```

## Debugging Failed Tests

### Run specific test file:
```bash
npm run test src/test/security/commentValidation.test.tsx
```

### Run tests matching pattern:
```bash
npm run test -- --grep "rate limit"
```

### Run with verbose output:
```bash
npm run test -- --reporter=verbose
```

### Debug in VS Code:
1. Set breakpoint in test file
2. Press F5 or use "Debug Test" CodeLens
3. Step through test execution

## Test Configuration

Test settings are in `vitest.config.ts`:

```typescript
{
  globals: true,           // No need to import describe/it/expect
  environment: 'jsdom',    // Simulates browser environment
  setupFiles: ['./src/test/setup.ts'],  // Runs before all tests
  include: ['**/*.{test,spec}.{ts,tsx}']  // Test file patterns
}
```

## Mocking Strategy

The tests use mocks to avoid hitting real services:

- **Supabase Client**: Mocked to return test data
- **Toast Notifications**: Mocked to capture calls
- **Time**: Controllable via `vi.useFakeTimers()`
- **User Events**: Simulated via `@testing-library/user-event`

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what users experience
2. **Isolate Tests**: Each test should be independent
3. **Clear Assertions**: Use descriptive expect messages
4. **Arrange-Act-Assert**: Follow AAA pattern consistently
5. **Mock External Dependencies**: Don't hit real APIs or databases
6. **Test Edge Cases**: Empty, null, undefined, very long, special chars
7. **Security First**: Always test negative cases (injection, overflow)

## Troubleshooting

### Tests pass locally but fail in CI:
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run test
```

### "Cannot find module" errors:
```bash
# Verify TypeScript paths are correct
cat tsconfig.json | grep "paths"

# Regenerate type definitions
npm run build
```

### Timeout errors:
Increase timeout in test file:
```typescript
it('long running test', { timeout: 10000 }, async () => {
  // test code
});
```

### Mock not working:
```typescript
// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Security Testing Best Practices](https://owasp.org/www-project-web-security-testing-guide/)
- [Project Security README](./src/test/README.md)

## Support

If you encounter issues with the test suite:
1. Check this documentation first
2. Review test output and error messages
3. Check test logs in `/coverage` directory
4. Consult the team or open an issue

---

**Last Updated**: November 2025
**Test Coverage Target**: > 80%
**Current Test Count**: 70+ security tests
