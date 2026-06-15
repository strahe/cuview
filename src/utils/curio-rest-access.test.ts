import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatCurioCorsOriginsValue,
  formatCurioRestAccessMessage,
} from "./curio-rest-access";

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

describe("formatCurioRestAccessMessage", () => {
  it("masks URL credentials while preserving the error context", () => {
    expect(
      formatCurioRestAccessMessage(
        new Error("Failed to connect to http://user:secret@localhost:4701"),
      ),
    ).toBe("Failed to connect to http://***:***@localhost:4701");
  });
});
