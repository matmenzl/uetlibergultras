import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Simulated rate limit implementation for testing
interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private rateLimitMap = new Map<string, RateLimitEntry>();

  checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const existing = this.rateLimitMap.get(identifier);

    // Clean up if expired
    if (existing && now > existing.resetAt) {
      this.rateLimitMap.delete(identifier);
    }

    const current = this.rateLimitMap.get(identifier);

    if (!current) {
      const resetAt = now + config.windowMs;
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetAt,
      });
      return { allowed: true, remaining: config.requests - 1, resetAt };
    }

    if (current.count >= config.requests) {
      return { allowed: false, remaining: 0, resetAt: current.resetAt };
    }

    current.count++;
    return {
      allowed: true,
      remaining: config.requests - current.count,
      resetAt: current.resetAt,
    };
  }

  reset() {
    this.rateLimitMap.clear();
  }
}

describe('Rate Limiting Security Tests', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const config = { requests: 10, windowMs: 60000 };

      // First request should be allowed
      const result1 = rateLimiter.checkRateLimit('user1', config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(9);

      // Second request should be allowed
      const result2 = rateLimiter.checkRateLimit('user1', config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(8);
    });

    it('should block requests exceeding limit', () => {
      const config = { requests: 3, windowMs: 60000 };

      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        const result = rateLimiter.checkRateLimit('user1', config);
        expect(result.allowed).toBe(true);
      }

      // 4th request should be blocked
      const result4 = rateLimiter.checkRateLimit('user1', config);
      expect(result4.allowed).toBe(false);
      expect(result4.remaining).toBe(0);
    });

    it('should track different users independently', () => {
      const config = { requests: 2, windowMs: 60000 };

      // User 1 makes 2 requests
      rateLimiter.checkRateLimit('user1', config);
      rateLimiter.checkRateLimit('user1', config);

      // User 1 is blocked
      const user1Result = rateLimiter.checkRateLimit('user1', config);
      expect(user1Result.allowed).toBe(false);

      // User 2 can still make requests
      const user2Result = rateLimiter.checkRateLimit('user2', config);
      expect(user2Result.allowed).toBe(true);
    });
  });

  describe('Time Window Reset', () => {
    it('should reset rate limit after window expires', () => {
      const config = { requests: 2, windowMs: 60000 };

      // Use up the limit
      rateLimiter.checkRateLimit('user1', config);
      rateLimiter.checkRateLimit('user1', config);

      // Should be blocked
      const blockedResult = rateLimiter.checkRateLimit('user1', config);
      expect(blockedResult.allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(60001);

      // Should be allowed again
      const allowedResult = rateLimiter.checkRateLimit('user1', config);
      expect(allowedResult.allowed).toBe(true);
      expect(allowedResult.remaining).toBe(1);
    });

    it('should not reset before window expires', () => {
      const config = { requests: 2, windowMs: 60000 };

      // Use up the limit
      rateLimiter.checkRateLimit('user1', config);
      rateLimiter.checkRateLimit('user1', config);

      // Advance time but not past window
      vi.advanceTimersByTime(30000);

      // Should still be blocked
      const result = rateLimiter.checkRateLimit('user1', config);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Rate Limit Configurations', () => {
    it('should enforce leaderboard rate limit (30 req/min)', () => {
      const config = { requests: 30, windowMs: 60000 };

      // Make 30 requests - all should succeed
      for (let i = 0; i < 30; i++) {
        const result = rateLimiter.checkRateLimit('leaderboard-user', config);
        expect(result.allowed).toBe(true);
      }

      // 31st request should be blocked
      const result = rateLimiter.checkRateLimit('leaderboard-user', config);
      expect(result.allowed).toBe(false);
    });

    it('should enforce OAuth rate limit (10 req/min)', () => {
      const config = { requests: 10, windowMs: 60000 };

      // Make 10 requests - all should succeed
      for (let i = 0; i < 10; i++) {
        const result = rateLimiter.checkRateLimit('oauth-user', config);
        expect(result.allowed).toBe(true);
      }

      // 11th request should be blocked
      const result = rateLimiter.checkRateLimit('oauth-user', config);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Remaining Count', () => {
    it('should correctly track remaining requests', () => {
      const config = { requests: 5, windowMs: 60000 };

      const results = [];
      for (let i = 0; i < 6; i++) {
        results.push(rateLimiter.checkRateLimit('user1', config));
      }

      expect(results[0].remaining).toBe(4);
      expect(results[1].remaining).toBe(3);
      expect(results[2].remaining).toBe(2);
      expect(results[3].remaining).toBe(1);
      expect(results[4].remaining).toBe(0);
      expect(results[5].remaining).toBe(0);
      expect(results[5].allowed).toBe(false);
    });
  });

  describe('Burst Protection', () => {
    it('should handle rapid successive requests', () => {
      const config = { requests: 100, windowMs: 60000 };

      // Simulate 150 rapid requests
      let blockedCount = 0;
      for (let i = 0; i < 150; i++) {
        const result = rateLimiter.checkRateLimit('burst-user', config);
        if (!result.allowed) {
          blockedCount++;
        }
      }

      // Should block exactly 50 requests (150 - 100)
      expect(blockedCount).toBe(50);
    });
  });

  describe('Reset Timing', () => {
    it('should provide correct reset timestamp', () => {
      const config = { requests: 5, windowMs: 60000 };
      const startTime = Date.now();

      const result = rateLimiter.checkRateLimit('user1', config);

      // Reset time should be startTime + windowMs
      expect(result.resetAt).toBe(startTime + config.windowMs);
    });

    it('should maintain same reset time for all requests in window', () => {
      const config = { requests: 5, windowMs: 60000 };

      const result1 = rateLimiter.checkRateLimit('user1', config);
      
      vi.advanceTimersByTime(1000);
      
      const result2 = rateLimiter.checkRateLimit('user1', config);

      // Both should have the same reset time
      expect(result1.resetAt).toBe(result2.resetAt);
    });
  });
});
