import { describe, it, expect } from "vitest";
import { WaniKaniError, WaniKaniApiError, WaniKaniRateLimitError } from "../../src/utils/errors.js";

describe("WaniKaniError", () => {
  it("is an instance of Error", () => {
    const error = new WaniKaniError("test");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("WaniKaniError");
    expect(error.message).toBe("test");
  });
});

describe("WaniKaniApiError", () => {
  it("includes status and code", () => {
    const error = new WaniKaniApiError(404, 404, "Not found");
    expect(error).toBeInstanceOf(WaniKaniError);
    expect(error.status).toBe(404);
    expect(error.code).toBe(404);
    expect(error.apiMessage).toBe("Not found");
    expect(error.message).toBe("WaniKani API error 404: Not found");
  });
});

describe("WaniKaniRateLimitError", () => {
  it("includes reset time", () => {
    const resetAt = new Date("2024-01-15T12:00:00Z");
    const error = new WaniKaniRateLimitError(resetAt);
    expect(error).toBeInstanceOf(WaniKaniApiError);
    expect(error.status).toBe(429);
    expect(error.resetAt).toBe(resetAt);
  });
});
