// In-memory per-isolate rate limiter (resets on cold start, good enough for spend control)
// For production, replace with an atomic Redis/Supabase counter.
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  maxCalls: number;   // allowed calls in the window
  windowMs: number;   // window size in milliseconds
}

// Defaults: 20 calls per minute per user per endpoint
const DEFAULT_CONFIG: RateLimitConfig = { maxCalls: 20, windowMs: 60_000 };

export function checkRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean } {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + config.windowMs };
    buckets.set(key, bucket);
  }

  if (bucket.count >= config.maxCalls) return { allowed: false };
  bucket.count++;
  return { allowed: true };
}
