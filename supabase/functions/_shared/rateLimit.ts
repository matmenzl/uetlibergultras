interface RateLimitConfig {
  requests: number;  // Max requests
  windowMs: number;  // Time window in milliseconds
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean every minute

export async function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);
  
  // Clean up if expired
  if (existing && now > existing.resetAt) {
    rateLimitMap.delete(identifier);
  }
  
  const current = rateLimitMap.get(identifier);
  
  if (!current) {
    // First request in window
    const resetAt = now + config.windowMs;
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt
    });
    return { allowed: true, remaining: config.requests - 1, resetAt };
  }
  
  if (current.count >= config.requests) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }
  
  current.count++;
  return { allowed: true, remaining: config.requests - current.count, resetAt: current.resetAt };
}

export function getClientIdentifier(req: Request): string {
  // Use IP address as identifier
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  return ip;
}
