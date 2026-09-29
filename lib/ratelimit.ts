/**
 * Simple in-memory rate limiter for edge/server routes.
 * Resets per instance (not cluster-safe). Good enough for a single Vercel region.
 * For multi-region, replace with Upstash Redis rate limiter.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Prune old entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 10 * 60 * 1000)
}

/**
 * Check and increment the rate limit counter.
 * @param key      e.g. "POST_/api/requests:1.2.3.4"
 * @param limit    max requests allowed in the window
 * @param windowMs window size in milliseconds
 * @returns { allowed: boolean, remaining: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  let entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  return { allowed: entry.count <= limit, remaining }
}
