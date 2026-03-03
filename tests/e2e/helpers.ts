import { createWaniKaniClient, type WaniKaniClient } from "../../src/index.js";

let client: WaniKaniClient | undefined;

export function getClient(): WaniKaniClient {
  if (client) return client;
  const apiToken = process.env.WANIKANI_API_KEY;
  if (!apiToken) {
    throw new Error("WANIKANI_API_KEY environment variable is required for E2E tests");
  }
  client = createWaniKaniClient({ apiToken });
  return client;
}

/** Assert the shape of a WKResource envelope (with numeric id). */
export function assertResource(value: unknown): asserts value is Record<string, unknown> {
  expect(value).toBeDefined();
  const obj = value as Record<string, unknown>;
  expect(typeof obj.id).toBe("number");
  expect(typeof obj.object).toBe("string");
  expect(typeof obj.url).toBe("string");
  expect(obj.data_updated_at === null || typeof obj.data_updated_at === "string").toBe(true);
  expect(typeof obj.data).toBe("object");
  expect(obj.data).not.toBeNull();
}

/** Assert the shape of a WKSingularResource envelope (no id, e.g. /user). */
export function assertSingularResource(value: unknown): asserts value is Record<string, unknown> {
  expect(value).toBeDefined();
  const obj = value as Record<string, unknown>;
  expect(typeof obj.object).toBe("string");
  expect(typeof obj.url).toBe("string");
  expect(obj.data_updated_at === null || typeof obj.data_updated_at === "string").toBe(true);
  expect(typeof obj.data).toBe("object");
  expect(obj.data).not.toBeNull();
}

/** Assert the shape of a WKReport envelope (/summary). */
export function assertReport(value: unknown): asserts value is Record<string, unknown> {
  expect(value).toBeDefined();
  const obj = value as Record<string, unknown>;
  expect(obj.object).toBe("report");
  expect(typeof obj.url).toBe("string");
  expect(obj.data_updated_at === null || typeof obj.data_updated_at === "string").toBe(true);
  expect(typeof obj.data).toBe("object");
  expect(obj.data).not.toBeNull();
}

/** Collect up to `max` items from an async iterable. */
export async function take<T>(iterable: AsyncIterable<T>, max: number): Promise<T[]> {
  const items: T[] = [];
  let count = 0;
  for await (const item of iterable) {
    items.push(item);
    count++;
    if (count >= max) break;
  }
  return items;
}
