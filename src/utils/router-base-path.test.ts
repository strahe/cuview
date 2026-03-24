import { describe, expect, it } from "vitest";
import { getRouterBasePath, getViteBasePath } from "./router-base-path";

describe("getRouterBasePath", () => {
  it("returns root path when input is missing or invalid", () => {
    expect(getRouterBasePath(undefined)).toBe("/");
    expect(getRouterBasePath("")).toBe("/");
    expect(getRouterBasePath("cuview")).toBe("/");
    expect(getRouterBasePath("./")).toBe("/");
  });

  it("keeps root path for slash-only base", () => {
    expect(getRouterBasePath("/")).toBe("/");
    expect(getRouterBasePath("///")).toBe("/");
  });

  it("normalizes non-root paths by trimming trailing slash", () => {
    expect(getRouterBasePath("/cuview")).toBe("/cuview");
    expect(getRouterBasePath("/cuview/")).toBe("/cuview");
    expect(getRouterBasePath("/cuview///")).toBe("/cuview");
  });
});

describe("getViteBasePath", () => {
  it("returns root slash when input is missing or invalid", () => {
    expect(getViteBasePath(undefined)).toBe("/");
    expect(getViteBasePath("")).toBe("/");
    expect(getViteBasePath("cuview")).toBe("/");
    expect(getViteBasePath("./")).toBe("/");
  });

  it("normalizes paths to exactly one trailing slash", () => {
    expect(getViteBasePath("/")).toBe("/");
    expect(getViteBasePath("///")).toBe("/");
    expect(getViteBasePath("/cuview")).toBe("/cuview/");
    expect(getViteBasePath("/cuview/")).toBe("/cuview/");
    expect(getViteBasePath("/cuview///")).toBe("/cuview/");
  });
});
