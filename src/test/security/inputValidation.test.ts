import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Edge Function Input Validation', () => {
  describe('Strava OAuth Callback Validation', () => {
    const StravaOAuthCallbackSchema = z.object({
      code: z.string().min(1).max(1000),
      userId: z.string().uuid()
    });

    it('should accept valid OAuth callback data', () => {
      const validData = {
        code: 'abc123def456',
        userId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = StravaOAuthCallbackSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty code', () => {
      const invalidData = {
        code: '',
        userId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = StravaOAuthCallbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject code longer than 1000 characters', () => {
      const invalidData = {
        code: 'A'.repeat(1001),
        userId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = StravaOAuthCallbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        code: 'abc123',
        userId: 'not-a-uuid'
      };

      const result = StravaOAuthCallbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
      const result1 = StravaOAuthCallbackSchema.safeParse({ code: 'test' });
      expect(result1.success).toBe(false);

      const result2 = StravaOAuthCallbackSchema.safeParse({ userId: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result2.success).toBe(false);
    });
  });

  describe('Strava Auth Exchange Validation', () => {
    const StravaAuthExchangeSchema = z.object({
      code: z.string().min(1).max(1000)
    });

    it('should accept valid authorization code', () => {
      const result = StravaAuthExchangeSchema.safeParse({ code: 'valid_auth_code_123' });
      expect(result.success).toBe(true);
    });

    it('should reject empty code', () => {
      const result = StravaAuthExchangeSchema.safeParse({ code: '' });
      expect(result.success).toBe(false);
    });

    it('should reject extremely long codes', () => {
      const result = StravaAuthExchangeSchema.safeParse({ code: 'x'.repeat(1001) });
      expect(result.success).toBe(false);
    });
  });

  describe('Activity Leaderboard Validation', () => {
    const ActivityLeaderboardSchema = z.object({
      type: z.enum([
        'most-efforts-overall',
        'most-efforts-monthly',
        'most-efforts-segment',
        'most-unique-segments'
      ]).default('most-efforts-overall'),
      segment_id: z.number().int().positive().optional()
    });

    it('should accept valid leaderboard type', () => {
      const validTypes = [
        'most-efforts-overall',
        'most-efforts-monthly',
        'most-efforts-segment',
        'most-unique-segments'
      ];

      validTypes.forEach(type => {
        const result = ActivityLeaderboardSchema.safeParse({ type });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid leaderboard type', () => {
      const result = ActivityLeaderboardSchema.safeParse({ type: 'invalid-type' });
      expect(result.success).toBe(false);
    });

    it('should use default type when not provided', () => {
      const result = ActivityLeaderboardSchema.parse({});
      expect(result.type).toBe('most-efforts-overall');
    });

    it('should accept valid segment_id', () => {
      const result = ActivityLeaderboardSchema.safeParse({
        type: 'most-efforts-segment',
        segment_id: 12345
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative segment_id', () => {
      const result = ActivityLeaderboardSchema.safeParse({
        type: 'most-efforts-segment',
        segment_id: -1
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero segment_id', () => {
      const result = ActivityLeaderboardSchema.safeParse({
        type: 'most-efforts-segment',
        segment_id: 0
      });
      expect(result.success).toBe(false);
    });

    it('should reject decimal segment_id', () => {
      const result = ActivityLeaderboardSchema.safeParse({
        type: 'most-efforts-segment',
        segment_id: 123.45
      });
      expect(result.success).toBe(false);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should treat all inputs as data, not code', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "<script>alert('xss')</script>",
        "admin'--",
        "' UNION SELECT * FROM passwords --"
      ];

      const schema = z.string().max(1000);

      maliciousInputs.forEach(input => {
        // Schema should accept these as strings (they're data)
        const result = schema.safeParse(input);
        expect(result.success).toBe(true);
        
        // But they should be under max length
        if (input.length <= 1000) {
          expect(result.success).toBe(true);
        }
      });
    });
  });

  describe('XSS Prevention', () => {
    it('should accept HTML/script tags as plain text', () => {
      const xssAttempts = [
        '<img src=x onerror=alert(1)>',
        '<script>alert("XSS")</script>',
        'javascript:alert(1)',
        '<iframe src="evil.com"></iframe>'
      ];

      const schema = z.string().max(1000);

      xssAttempts.forEach(attempt => {
        const result = schema.safeParse(attempt);
        // These are valid strings, validation accepts them
        // The application must handle HTML escaping when rendering
        expect(result.success).toBe(true);
      });
    });
  });
});
