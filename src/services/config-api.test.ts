import { describe, expect, it } from "vitest";
import { sanitizeSchemaPatterns } from "./config-api";

describe("sanitizeSchemaPatterns", () => {
  it("removes example-style pattern and moves to description", () => {
    const schema = {
      type: "string",
      pattern: "0h0m0s",
    };
    const result = sanitizeSchemaPatterns(schema) as Record<string, unknown>;
    expect(result.pattern).toBeUndefined();
    expect(result.description).toBe("Format: 0h0m0s");
  });

  it("appends to existing description", () => {
    const schema = {
      type: "string",
      description: "Duration value",
      pattern: "6h30m0s",
    };
    const result = sanitizeSchemaPatterns(schema) as Record<string, unknown>;
    expect(result.pattern).toBeUndefined();
    expect(result.description).toBe("Duration value (Format: 6h30m0s)");
  });

  it("preserves valid regex patterns", () => {
    const schema = {
      type: "string",
      pattern: "^[0-9]+h[0-9]+m[0-9]+s$",
    };
    const result = sanitizeSchemaPatterns(schema) as Record<string, unknown>;
    expect(result.pattern).toBe("^[0-9]+h[0-9]+m[0-9]+s$");
  });

  it("handles FIL example patterns", () => {
    const schema = {
      type: "string",
      pattern: "1 fil/0.03 fil/0.31/1 attofil",
    };
    const result = sanitizeSchemaPatterns(schema) as Record<string, unknown>;
    expect(result.pattern).toBeUndefined();
    expect(result.description).toBe("Format: 1 fil/0.03 fil/0.31/1 attofil");
  });

  it("recurses into properties", () => {
    const schema = {
      type: "object",
      properties: {
        duration: { type: "string", pattern: "0h0m0s" },
        name: { type: "string", pattern: "^[a-z]+$" },
      },
    };
    const result = sanitizeSchemaPatterns(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props.duration?.pattern).toBeUndefined();
    expect(props.duration?.description).toBe("Format: 0h0m0s");
    expect(props.name?.pattern).toBe("^[a-z]+$");
  });

  it("recurses into $defs", () => {
    const schema = {
      $defs: {
        Duration: { type: "string", pattern: "0h0m0s" },
      },
    };
    const result = sanitizeSchemaPatterns(schema) as Record<string, unknown>;
    const defs = result.$defs as Record<string, Record<string, unknown>>;
    expect(defs.Duration?.pattern).toBeUndefined();
  });

  it("recurses into items", () => {
    const schema = {
      type: "array",
      items: { type: "string", pattern: "0h0m0s" },
    };
    const result = sanitizeSchemaPatterns(schema) as Record<string, unknown>;
    const items = result.items as Record<string, unknown>;
    expect(items.pattern).toBeUndefined();
  });

  it("preserves tuple-array items while sanitizing each schema", () => {
    const schema = {
      type: "array",
      items: [
        { type: "string", pattern: "0h0m0s" },
        { type: "string", pattern: "^[a-z]+$" },
      ],
    };
    const result = sanitizeSchemaPatterns(schema) as Record<string, unknown>;
    expect(Array.isArray(result.items)).toBe(true);
    const items = result.items as Record<string, unknown>[];
    expect(items[0]?.pattern).toBeUndefined();
    expect(items[0]?.description).toBe("Format: 0h0m0s");
    expect(items[1]?.pattern).toBe("^[a-z]+$");
  });

  it("preserves root arrays while sanitizing each schema entry", () => {
    const schema = [
      { type: "string", pattern: "0h0m0s" },
      { type: "string", pattern: "^[a-z]+$" },
    ];
    const result = sanitizeSchemaPatterns(schema) as Record<string, unknown>[];
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.pattern).toBeUndefined();
    expect(result[0]?.description).toBe("Format: 0h0m0s");
    expect(result[1]?.pattern).toBe("^[a-z]+$");
  });

  it("preserves arrays reached through properties recursion", () => {
    const schema = {
      type: "object",
      properties: {
        tupleGroup: [
          { type: "string", pattern: "0h0m0s" },
          { type: "string", pattern: "^[a-z]+$" },
        ],
      },
    };
    const result = sanitizeSchemaPatterns(schema) as Record<string, unknown>;
    const props = result.properties as Record<string, unknown>;
    expect(Array.isArray(props.tupleGroup)).toBe(true);
    const tupleGroup = props.tupleGroup as Record<string, unknown>[];
    expect(tupleGroup[0]?.pattern).toBeUndefined();
    expect(tupleGroup[0]?.description).toBe("Format: 0h0m0s");
    expect(tupleGroup[1]?.pattern).toBe("^[a-z]+$");
  });

  it("passes through non-object values unchanged", () => {
    expect(sanitizeSchemaPatterns(null)).toBeNull();
    expect(sanitizeSchemaPatterns(42)).toBe(42);
    expect(sanitizeSchemaPatterns("hello")).toBe("hello");
  });
});
