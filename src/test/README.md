# Security Test Suite

This directory contains automated security tests for the Uetliberg Läufe application.

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Test Structure

### `/security/commentValidation.test.tsx`
Tests for comment input validation including:
- Frontend validation (React components)
- Character length limits (2-1000 chars)
- Character counter functionality
- Whitespace trimming
- Zod schema validation
- User interaction flows

### `/security/inputValidation.test.ts`
Tests for edge function input validation:
- Strava OAuth callback validation
- Authorization code validation
- Leaderboard type validation
- SQL injection prevention
- XSS attempt handling
- UUID format validation

### `/security/rateLimit.test.ts`
Tests for rate limiting functionality:
- Request counting per user
- Time window enforcement
- Rate limit reset behavior
- Different rate configurations (10, 30 req/min)
- Burst protection
- Independent user tracking

### `/security/integration.test.ts`
Integration tests covering:
- Defense in depth (multiple validation layers)
- Error message security (no information leakage)
- Authentication requirements
- Data sanitization
- Caching behavior
- Security headers

## Coverage Goals

Target coverage: **> 80%** for all security-critical code

Focus areas:
- ✅ Comment validation (client & server)
- ✅ Input validation (edge functions)
- ✅ Rate limiting logic
- ✅ Authentication checks
- ✅ Error handling

## Security Test Checklist

Before deployment, ensure all tests pass:

- [ ] Comment length validation (2-1000 chars)
- [ ] Rate limiting (10-30 req/min depending on endpoint)
- [ ] Input type validation (UUID, string length, enums)
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Generic error messages (no info leakage)
- [ ] Database constraints enforcement
- [ ] Authentication requirements
- [ ] CORS headers
- [ ] Cache invalidation

## Adding New Tests

When adding new security features:

1. Create test file in appropriate subdirectory
2. Follow existing naming convention: `featureName.test.ts`
3. Include both positive and negative test cases
4. Test edge cases and boundary conditions
5. Update this README with new test description

## Continuous Integration

These tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests (CI pipeline)
- Before production deployments

## Test Data

Test data is mocked to avoid hitting real APIs:
- Supabase client is mocked
- Toast notifications are mocked
- Date/time is controllable via `vi.useFakeTimers()`

## Debugging Tests

```bash
# Run specific test file
npm run test -- commentValidation.test.tsx

# Run tests matching pattern
npm run test -- --grep "rate limit"

# Run with verbose output
npm run test -- --reporter=verbose
```

## Dependencies

- **Vitest**: Test runner and assertion library
- **Testing Library**: React component testing
- **User Event**: Simulating user interactions
- **Zod**: Schema validation (also used in production)
- **jsdom**: DOM environment for tests

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clear Names**: Test names should describe what they verify
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **Mock External Dependencies**: Don't hit real APIs
5. **Test User Behavior**: Focus on user-facing functionality
6. **Security First**: Always test negative cases (injection, overflow, etc.)

## Troubleshooting

**Tests failing locally but passing in CI:**
- Clear node_modules and reinstall
- Check Node.js version matches CI

**Timeout errors:**
- Increase timeout in vitest.config.ts
- Check for unresolved promises

**Mock issues:**
- Ensure mocks are cleared in `beforeEach`
- Check mock implementation matches real API
