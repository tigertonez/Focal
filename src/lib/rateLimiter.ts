
// A simple in-memory rate limiter for demonstration purposes.
// In a production environment with multiple server instances, a distributed
// store like Redis would be necessary.

interface RateLimitInfo {
  count: number;
  startTime: number;
}

const userRequests = new Map<string, RateLimitInfo>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 8;

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  let record = userRequests.get(identifier);

  // If the record is outside the window, reset it.
  if (record && now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    record = undefined;
  }
  
  // If no record exists, create one.
  if (!record) {
    record = { count: 0, startTime: now };
  }

  // Increment the count and check against the limit.
  record.count += 1;
  userRequests.set(identifier, record);
  
  return record.count <= MAX_REQUESTS_PER_WINDOW;
}
