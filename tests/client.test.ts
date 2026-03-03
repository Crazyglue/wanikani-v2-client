import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWaniKaniClient } from "../src/client.js";
import type { WaniKaniClient } from "../src/client.js";
import { WaniKaniApiError, WaniKaniRateLimitError } from "../src/utils/errors.js";

function mockFetch(body: unknown, options?: { status?: number; headers?: Record<string, string> }) {
  const status = options?.status ?? 200;
  const headers = new Headers(options?.headers);
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers,
    json: () => Promise.resolve(body),
  });
}

function makeCollection(data: unknown[], nextUrl: string | null = null) {
  return {
    object: "collection",
    url: "https://api.wanikani.com/v2/subjects",
    pages: { next_url: nextUrl, previous_url: null, per_page: 2 },
    total_count: data.length,
    data_updated_at: null,
    data,
  };
}

function makeResource(id: number, data: Record<string, unknown>) {
  return { id, object: "subject", url: "", data_updated_at: null, data };
}

describe("WaniKaniClient", () => {
  let client: WaniKaniClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = mockFetch({});
    client = createWaniKaniClient({
      apiToken: "test-token",
      fetch: fetchMock,
      maxRetries: 0,
    });
  });

  describe("authentication", () => {
    it("sends Authorization header", async () => {
      fetchMock = mockFetch({ id: 1, object: "user", url: "", data_updated_at: null, data: {} });
      client = createWaniKaniClient({ apiToken: "my-token", fetch: fetchMock, maxRetries: 0 });

      await client.getUser();
      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers.Authorization).toBe("Bearer my-token");
    });

    it("sends Wanikani-Revision header", async () => {
      fetchMock = mockFetch({ id: 1, object: "user", url: "", data_updated_at: null, data: {} });
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      await client.getUser();
      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers["Wanikani-Revision"]).toBe("20170710");
    });
  });

  describe("getUser", () => {
    it("fetches user data", async () => {
      const userData = {
        object: "user",
        url: "https://api.wanikani.com/v2/user",
        data_updated_at: "2024-01-01T00:00:00.000Z",
        data: {
          username: "testuser",
          level: 10,
        },
      };
      fetchMock = mockFetch(userData);
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      const result = await client.getUser();
      expect(result.data.username).toBe("testuser");
      expect(result.data.level).toBe(10);
    });
  });

  describe("getAssignment", () => {
    it("fetches a single assignment", async () => {
      const assignment = {
        id: 42,
        object: "assignment",
        url: "https://api.wanikani.com/v2/assignments/42",
        data_updated_at: "2024-01-01T00:00:00.000Z",
        data: { subject_id: 100, srs_stage: 5 },
      };
      fetchMock = mockFetch(assignment);
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      const result = await client.getAssignment(42);
      expect(result.id).toBe(42);
      expect(result.data.subject_id).toBe(100);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain("/assignments/42");
    });
  });

  describe("listAssignments", () => {
    it("sends query parameters", async () => {
      fetchMock = mockFetch(makeCollection([]));
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      const items: unknown[] = [];
      for await (const item of client.listAssignments({ levels: [1, 2], burned: false })) {
        items.push(item);
      }

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain("levels=1%2C2");
      expect(url).toContain("burned=false");
      expect(items).toHaveLength(0);
    });
  });

  describe("pagination", () => {
    it("iterates through multiple pages", async () => {
      const page1 = makeCollection(
        [makeResource(1, { characters: "一" }), makeResource(2, { characters: "二" })],
        "https://api.wanikani.com/v2/subjects?page_after_id=2",
      );
      const page2 = makeCollection([makeResource(3, { characters: "三" })]);

      fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve(page1),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve(page2),
        });
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      const items: unknown[] = [];
      for await (const item of client.listSubjects()) {
        items.push(item);
      }

      expect(items).toHaveLength(3);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("surfaces errors mid-stream during pagination (#10)", async () => {
      const page1 = makeCollection(
        [makeResource(1, { characters: "一" }), makeResource(2, { characters: "二" })],
        "https://api.wanikani.com/v2/subjects?page_after_id=2",
      );

      fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve(page1),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          headers: new Headers(),
          json: () => Promise.resolve({ error: "Something broke", code: 500 }),
        });
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      const items: unknown[] = [];
      await expect(async () => {
        for await (const item of client.listSubjects()) {
          items.push(item);
        }
      }).rejects.toThrow(WaniKaniApiError);

      // First page items should have been yielded before the error
      expect(items).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("handles empty first page", async () => {
      fetchMock = mockFetch(makeCollection([]));
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      const items: unknown[] = [];
      for await (const item of client.listSubjects()) {
        items.push(item);
      }
      expect(items).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    it("throws WaniKaniApiError on 401", async () => {
      fetchMock = mockFetch({ error: "Unauthorized", code: 401 }, { status: 401 });
      client = createWaniKaniClient({ apiToken: "bad-token", fetch: fetchMock, maxRetries: 0 });

      await expect(client.getUser()).rejects.toThrow(WaniKaniApiError);
    });

    it("throws WaniKaniRateLimitError on 429", async () => {
      const resetTime = String(Math.floor(Date.now() / 1000) + 60);
      fetchMock = mockFetch(
        { error: "Rate limit exceeded", code: 429 },
        { status: 429, headers: { "RateLimit-Reset": resetTime } },
      );
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      await expect(client.getUser()).rejects.toThrow(WaniKaniRateLimitError);
    });

    it("throws WaniKaniApiError on 404", async () => {
      fetchMock = mockFetch({ error: "Not found", code: 404 }, { status: 404 });
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      await expect(client.getAssignment(999999)).rejects.toThrow(WaniKaniApiError);
      try {
        await client.getAssignment(999999);
      } catch (e) {
        expect((e as WaniKaniApiError).status).toBe(404);
      }
    });

    it("throws WaniKaniApiError on 304 Not Modified (#11)", async () => {
      fetchMock = mockFetch({}, { status: 304 });
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      await expect(client.getUser()).rejects.toThrow(WaniKaniApiError);
      try {
        await client.getUser();
      } catch (e) {
        expect((e as WaniKaniApiError).status).toBe(304);
      }
    });
  });

  describe("mutations", () => {
    it("createReview sends POST with body", async () => {
      const reviewResponse = {
        id: 1,
        object: "report",
        url: "",
        data_updated_at: null,
        data: {},
        resources_updated: {},
      };
      fetchMock = mockFetch(reviewResponse);
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      await client.createReview({
        subject_id: 123,
        incorrect_meaning_answers: 0,
        incorrect_reading_answers: 1,
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain("/reviews");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({
        review: {
          subject_id: 123,
          incorrect_meaning_answers: 0,
          incorrect_reading_answers: 1,
        },
      });
    });

    it("updateStudyMaterial sends PUT with body", async () => {
      const response = {
        id: 456,
        object: "study_material",
        url: "",
        data_updated_at: null,
        data: {},
      };
      fetchMock = mockFetch(response);
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      await client.updateStudyMaterial(456, { meaning_note: "updated note" });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain("/study_materials/456");
      expect(init.method).toBe("PUT");
      expect(JSON.parse(init.body)).toEqual({
        study_material: { meaning_note: "updated note" },
      });
    });

    it("startAssignment sends PUT", async () => {
      const response = {
        id: 10,
        object: "assignment",
        url: "",
        data_updated_at: null,
        data: {},
      };
      fetchMock = mockFetch(response);
      client = createWaniKaniClient({ apiToken: "test", fetch: fetchMock, maxRetries: 0 });

      await client.startAssignment(10);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain("/assignments/10/start");
      expect(init.method).toBe("PUT");
    });
  });
});
