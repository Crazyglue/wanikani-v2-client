/**
 * Serializes a params object to a URLSearchParams instance.
 * - Arrays are joined as comma-separated values
 * - Booleans become "true"/"false"
 * - Dates become ISO strings
 * - undefined/null values are omitted
 */
export function serializeParams(params: Record<string, unknown> | undefined): URLSearchParams {
  const search = new URLSearchParams();
  if (!params) return search;

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        search.set(key, value.join(","));
      }
    } else if (value instanceof Date) {
      search.set(key, value.toISOString());
    } else if (typeof value === "boolean") {
      search.set(key, String(value));
    } else {
      search.set(key, String(value));
    }
  }

  return search;
}
