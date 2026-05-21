import { afterEach, describe, expect, it, vi } from "vitest";
import { formatCurioCorsOriginsValue } from "./curio-rest-access";

describe("formatCurioCorsOriginsValue", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds the current HTTP origin once", () => {
    vi.stubGlobal("window", {
      location: { origin: "http://localhost:5173" },
    });

    expect(formatCurioCorsOriginsValue()).toBe(
      '["https://cuview.strahe.com", "http://cuview.strahe.com", "http://localhost:5173"]',
    );

    vi.stubGlobal("window", {
      location: { origin: "http://custom.local:8080" },
    });

    expect(formatCurioCorsOriginsValue()).toBe(
      '["https://cuview.strahe.com", "http://cuview.strahe.com", "http://localhost:5173", "http://custom.local:8080"]',
    );
  });
});
