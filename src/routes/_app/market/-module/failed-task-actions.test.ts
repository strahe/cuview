import { describe, expect, it, vi } from "vitest";
import {
  getFailedTaskActionTypes,
  type MarketFailedTaskCategory,
  runFailedTaskActions,
  toFailedTaskDisplayCategories,
} from "./failed-task-actions";

describe("market failed task actions", () => {
  const categories = [
    { label: "Download", count: 2, taskType: "downloading" },
    { label: "CommP", count: 0, taskType: "commp" },
    { label: "Index", count: 1, taskType: "index" },
  ] satisfies MarketFailedTaskCategory[];

  it("selects only concrete task categories with failures", () => {
    expect(getFailedTaskActionTypes(categories)).toEqual([
      "downloading",
      "index",
    ]);
  });

  it("runs bulk actions per concrete task category instead of using all", async () => {
    const mutation = { mutateAsync: vi.fn().mockResolvedValue(undefined) };

    await runFailedTaskActions(mutation, categories);

    expect(mutation.mutateAsync).toHaveBeenCalledTimes(2);
    expect(mutation.mutateAsync).toHaveBeenNthCalledWith(1, ["downloading"]);
    expect(mutation.mutateAsync).toHaveBeenNthCalledWith(2, ["index"]);
    expect(mutation.mutateAsync).not.toHaveBeenCalledWith(["all"]);
  });

  it("keeps display categories label-based", () => {
    expect(toFailedTaskDisplayCategories(categories)).toEqual([
      ["Download", 2],
      ["CommP", 0],
      ["Index", 1],
    ]);
  });
});
