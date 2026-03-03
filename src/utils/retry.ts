import { WaniKaniApiError, WaniKaniRateLimitError } from "./errors.js";

const RETRYABLE_STATUS_CODES = new Set([429, 500, 503]);

export interface RetryOptions {
  maxRetries: number;
}

/**
 * Executes an async function with retry logic for transient failures.
 * Uses exponential backoff with jitter. For 429 responses, waits until
 * the rate limit resets.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === options.maxRetries) break;
      if (!isRetryable(error)) break;

      const delay = getDelay(error, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Only retry our own error types with known-retryable status codes.
 * No duck-typing fallback — handleErrorResponse only throws WaniKaniApiError
 * subtypes, so this is the only path that matters (#5).
 */
function isRetryable(error: unknown): boolean {
  if (error instanceof WaniKaniApiError) {
    return RETRYABLE_STATUS_CODES.has(error.status);
  }
  return false;
}

function getDelay(error: unknown, attempt: number): number {
  if (error instanceof WaniKaniRateLimitError) {
    const waitMs = error.resetAt.getTime() - Date.now();
    // Guard against NaN (malformed header) and negative values (#6).
    // If the reset time is unparseable, fall back to exponential backoff.
    if (!Number.isFinite(waitMs) || waitMs < 0) {
      return exponentialBackoff(attempt);
    }
    return Math.max(waitMs, 100);
  }

  return exponentialBackoff(attempt);
}

function exponentialBackoff(attempt: number): number {
  // 1s, 2s, 4s, ... with up to 25% jitter reduction
  const baseMs = Math.pow(2, attempt) * 1000;
  const jitter = baseMs * Math.random() * 0.25;
  return baseMs - jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
