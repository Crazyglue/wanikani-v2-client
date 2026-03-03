import type { WKCollection, WKResource } from "../types/common.js";
import { WaniKaniApiError, WaniKaniRateLimitError } from "../utils/errors.js";
import { serializeParams } from "../utils/params.js";
import { withRetry } from "../utils/retry.js";

export interface ClientConfig {
  apiToken: string;
  baseUrl?: string;
  revision?: string;
  maxRetries?: number;
  /** Custom fetch implementation (defaults to globalThis.fetch). */
  fetch?: typeof globalThis.fetch;
}

export interface RequestOptions {
  method?: string;
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

const DEFAULT_BASE_URL = "https://api.wanikani.com/v2";
const DEFAULT_REVISION = "20170710";
const DEFAULT_MAX_RETRIES = 3;

/**
 * Internal interface exposed to endpoint factories.
 * Avoids `as any` casts while keeping these methods off the public API surface.
 */
export interface EndpointContext {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  list<T, P extends object = Record<string, unknown>>(
    path: string,
    params?: P,
  ): Promise<WKCollection<T>>;
  paginate<T, P extends object = Record<string, unknown>>(
    path: string,
    params?: P,
  ): AsyncIterable<WKResource<T>>;
  request<T>(path: string, options?: RequestOptions): Promise<T>;
}

export class BaseClient implements EndpointContext {
  private readonly apiToken: string;
  private readonly baseUrl: string;
  private readonly revision: string;
  private readonly maxRetries: number;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(config: ClientConfig) {
    this.apiToken = config.apiToken;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.revision = config.revision ?? DEFAULT_REVISION;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this._fetch = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /** Make an authenticated request to the WaniKani API. */
  request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", params, body, headers = {} } = options;

    const url = new URL(`${this.baseUrl}${path}`);
    const search = serializeParams(params);
    for (const [key, value] of search) {
      url.searchParams.set(key, value);
    }

    const requestHeaders: Record<string, string> = {
      Authorization: `Bearer ${this.apiToken}`,
      "Wanikani-Revision": this.revision,
      ...headers,
    };

    // Stringify once outside the retry loop (#4)
    let serializedBody: string | undefined;
    if (body !== undefined) {
      requestHeaders["Content-Type"] = "application/json; charset=utf-8";
      serializedBody = JSON.stringify(body);
    }

    return this.fetchWithRetry<T>(url.toString(), method, requestHeaders, serializedBody);
  }

  /** Fetch a single resource by path. */
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  /** Fetch a single page of a collection. */
  list<T, P extends object = Record<string, unknown>>(
    path: string,
    params?: P,
  ): Promise<WKCollection<T>> {
    return this.request<WKCollection<T>>(path, {
      method: "GET",
      params: params as Record<string, unknown>,
    });
  }

  /**
   * Returns an async iterable that automatically paginates through all items.
   * Yields individual `WKResource<T>` items across all pages.
   *
   * Each page is fetched on demand. The full page (up to 500-1000 items) is
   * buffered in memory and yielded one at a time before the next page is fetched.
   */
  paginate<T, P extends object = Record<string, unknown>>(
    path: string,
    params?: P,
  ): AsyncIterable<WKResource<T>> {
    const fetchPage = (url: string) => this.fetchCollectionByUrl<T>(url);
    const fetchFirst = () => this.list<T>(path, params as Record<string, unknown>);

    return {
      [Symbol.asyncIterator]() {
        let nextUrl: string | null | undefined = undefined;
        let buffer: WKResource<T>[] = [];
        let bufferIndex = 0;
        let done = false;

        return {
          async next(): Promise<IteratorResult<WKResource<T>>> {
            if (bufferIndex < buffer.length) {
              return { value: buffer[bufferIndex++], done: false };
            }

            if (done) return { value: undefined, done: true };

            let collection: WKCollection<T>;
            if (nextUrl === undefined) {
              collection = await fetchFirst();
            } else if (nextUrl !== null) {
              collection = await fetchPage(nextUrl);
            } else {
              return { value: undefined, done: true };
            }

            buffer = collection.data;
            bufferIndex = 0;
            nextUrl = collection.pages.next_url;

            if (!nextUrl) {
              done = true;
            }

            if (buffer.length === 0) {
              return { value: undefined, done: true };
            }

            return { value: buffer[bufferIndex++], done: false };
          },
        };
      },
    };
  }

  /**
   * Shared fetch+retry+parse pipeline used by both path-based and URL-based requests.
   * This is the single code path for all HTTP calls (#2).
   */
  private fetchWithRetry<T>(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: string,
  ): Promise<T> {
    return withRetry(
      async () => {
        const response = await this._fetch(url, { method, headers, body });

        if (!response.ok) {
          // Throws — never falls through (#3)
          await this.handleErrorResponse(response);
        }

        return (await response.json()) as T;
      },
      { maxRetries: this.maxRetries },
    );
  }

  /**
   * Fetch a collection by absolute URL (used for pagination next_url).
   * Reuses the single fetchWithRetry code path (#2).
   */
  private fetchCollectionByUrl<T>(url: string): Promise<WKCollection<T>> {
    return this.fetchWithRetry<WKCollection<T>>(url, "GET", {
      Authorization: `Bearer ${this.apiToken}`,
      "Wanikani-Revision": this.revision,
    });
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    // 304 Not Modified is not an error — but since we don't send conditional
    // headers yet, this is a safety guard for future support (#11).
    if (response.status === 304) {
      // Return an empty-ish response rather than throwing. In practice this
      // path is unreachable until If-None-Match/If-Modified-Since are added.
      throw new WaniKaniApiError(304, 304, "Not Modified");
    }

    if (response.status === 429) {
      const resetHeader = response.headers.get("RateLimit-Reset");
      const resetAt = resetHeader
        ? new Date(Number(resetHeader) * 1000)
        : new Date(Date.now() + 60_000);
      throw new WaniKaniRateLimitError(resetAt);
    }

    let errorMessage = response.statusText;
    let errorCode = response.status;

    try {
      const body = (await response.json()) as { error?: string; code?: number };
      if (body.error) errorMessage = body.error;
      if (body.code !== undefined) errorCode = body.code; // (#12) avoid falsy check
    } catch {
      // Response body may not be JSON
    }

    throw new WaniKaniApiError(response.status, errorCode, errorMessage);
  }
}
