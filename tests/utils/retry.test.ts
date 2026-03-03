import { describe, it, expect, vi } from "vitest";
import { withRetry } from "../../src/utils/retry.js";
import { WaniKaniApiError, WaniKaniRateLimitError } from "../../src/utils/errors.js";

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { maxRetries: 3 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on 500 errors", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new WaniKaniApiError(500, 500, "Internal"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, { maxRetries: 3 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on 503 errors", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new WaniKaniApiError(503, 503, "Service Unavailable"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, { maxRetries: 3 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on 429 rate limit errors", async () => {
    const resetAt = new Date(Date.now() + 100);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new WaniKaniRateLimitError(resetAt))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, { maxRetries: 3 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 401 errors", async () => {
    const fn = vi.fn().mockRejectedValue(new WaniKaniApiError(401, 401, "Unauthorized"));

    await expect(withRetry(fn, { maxRetries: 3 })).rejects.toThrow("Unauthorized");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry on 404 errors", async () => {
    const fn = vi.fn().mockRejectedValue(new WaniKaniApiError(404, 404, "Not found"));

    await expect(withRetry(fn, { maxRetries: 3 })).rejects.toThrow("Not found");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry on non-WaniKani errors (#5)", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("network failure"));

    await expect(withRetry(fn, { maxRetries: 3 })).rejects.toThrow("network failure");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws after max retries exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new WaniKaniApiError(500, 500, "Internal"));

    await expect(withRetry(fn, { maxRetries: 2 })).rejects.toThrow("Internal");
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("falls back to exponential backoff on NaN reset time (#6)", async () => {
    // Simulate a malformed RateLimit-Reset header producing NaN in the Date
    const badResetAt = new Date(NaN);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new WaniKaniRateLimitError(badResetAt))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, { maxRetries: 3 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
