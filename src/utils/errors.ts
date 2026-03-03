/** Base error for all WaniKani client errors. */
export class WaniKaniError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WaniKaniError";
  }
}

/** Error returned by the WaniKani API (non-2xx response). */
export class WaniKaniApiError extends WaniKaniError {
  readonly status: number;
  readonly code: number;
  readonly apiMessage: string;

  constructor(status: number, code: number, message: string) {
    super(`WaniKani API error ${status}: ${message}`);
    this.name = "WaniKaniApiError";
    this.status = status;
    this.code = code;
    this.apiMessage = message;
  }
}

/** Rate limit exceeded (429). Includes when the limit resets. */
export class WaniKaniRateLimitError extends WaniKaniApiError {
  readonly resetAt: Date;

  constructor(resetAt: Date) {
    super(429, 429, "Rate limit exceeded");
    this.name = "WaniKaniRateLimitError";
    this.resetAt = resetAt;
  }
}
