import { describe, expect, it } from "vitest";
import {
  DEFAULT_TASK_SEARCH,
  normalizeTaskSearch,
  patchTaskSearch,
} from "./search-state";

describe("task search state", () => {
  it("normalizes unknown raw search values", () => {
    const normalized = normalizeTaskSearch({
      q: "seal",
      showBg: "true",
      coalesce: "false",
      result: "failed",
      taskType: "TreeRC",
      taskId: "123",
      limit: "50",
      offset: "10",
    });

    expect(normalized).toEqual({
      q: "seal",
      showBg: true,
      coalesce: false,
      result: "failed",
      taskType: "TreeRC",
      taskId: 123,
      limit: 50,
      offset: 10,
    });
  });

  it("falls back to defaults on invalid values", () => {
    const normalized = normalizeTaskSearch({
      taskId: "-1",
      limit: "-9",
      offset: "oops",
      result: "unknown",
    });

    expect(normalized).toEqual(DEFAULT_TASK_SEARCH);
  });

  it("resets offset when filter state changes", () => {
    const next = patchTaskSearch(
      {
        ...DEFAULT_TASK_SEARCH,
        offset: 200,
      },
      { q: "new query" },
    );

    expect(next.offset).toBe(0);
    expect(next.q).toBe("new query");
  });
});
