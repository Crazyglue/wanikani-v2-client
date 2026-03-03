import { describe, it, expect } from "vitest";
import { serializeParams } from "../../src/utils/params.js";

describe("serializeParams", () => {
  it("returns empty URLSearchParams for undefined", () => {
    const result = serializeParams(undefined);
    expect(result.toString()).toBe("");
  });

  it("returns empty URLSearchParams for empty object", () => {
    const result = serializeParams({});
    expect(result.toString()).toBe("");
  });

  it("omits undefined and null values", () => {
    const result = serializeParams({ a: undefined, b: null, c: "kept" });
    expect(result.get("a")).toBeNull();
    expect(result.get("b")).toBeNull();
    expect(result.get("c")).toBe("kept");
  });

  it("serializes strings and numbers", () => {
    const result = serializeParams({ name: "test", level: 5 });
    expect(result.get("name")).toBe("test");
    expect(result.get("level")).toBe("5");
  });

  it("serializes booleans as strings", () => {
    const result = serializeParams({ hidden: true, burned: false });
    expect(result.get("hidden")).toBe("true");
    expect(result.get("burned")).toBe("false");
  });

  it("serializes arrays as comma-separated values", () => {
    const result = serializeParams({ ids: [1, 2, 3], types: ["kanji", "radical"] });
    expect(result.get("ids")).toBe("1,2,3");
    expect(result.get("types")).toBe("kanji,radical");
  });

  it("omits empty arrays", () => {
    const result = serializeParams({ ids: [] });
    expect(result.get("ids")).toBeNull();
  });

  it("serializes Date objects as ISO strings", () => {
    const date = new Date("2024-01-15T10:30:00.000Z");
    const result = serializeParams({ updated_after: date });
    expect(result.get("updated_after")).toBe("2024-01-15T10:30:00.000Z");
  });
});
