
interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

const limits = new Map<string, RateLimitEntry>();

/**
 * Rate limiter for client-side actions.
 * @param key Unique identifier (e.g., phone number or IP placeholder)
 * @param maxRequests Max allowed requests
 * @param windowMs Time window in milliseconds
 */
export const checkRateLimit = (key: string, maxRequests: number, windowMs: number): boolean => {
  const now = Date.now();
  const record = limits.get(key);

  if (!record) {
    limits.set(key, { count: 1, firstRequest: now });
    return true;
  }

  if (now - record.firstRequest > windowMs) {
    // Reset window
    limits.set(key, { count: 1, firstRequest: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};
