import { describe, expect, it } from "vitest";
import {
  buildCoalescedQueueRows,
  filterTaskHistoryRows,
  filterTaskStatRows,
  filterTaskSummaryRows,
} from "./filters";
import type {
  TaskHistorySummaryView,
  TaskStatView,
  TaskSummaryView,
} from "./types";

const sampleSummary: TaskSummaryView[] = [
  {
    id: 1,
    name: "bg:gc",
    spId: "",
    miner: "",
    sincePosted: "2026-03-02T08:00:00Z",
    sincePostedStr: "5s",
    owner: "",
    ownerId: null,
    status: "pending",
    isBackground: true,
  },
  {
    id: 2,
    name: "SealSDR",
    spId: "123",
    miner: "f0123",
    sincePosted: "2026-03-02T08:00:00Z",
    sincePostedStr: "10s",
    owner: "10.0.0.8:4701",
    ownerId: 8,
    status: "running",
    isBackground: false,
  },
];

const foregroundTask = sampleSummary[1] as TaskSummaryView;

const sampleHistory: TaskHistorySummaryView[] = [
  {
    taskId: 10,
    name: "TreeRC",
    posted: "Mar 2, 2026 08:00",
    start: "Mar 2, 2026 08:01",
    queued: "1m",
    took: "15s",
    result: true,
    err: "",
    completedBy: "worker-01",
  },
  {
    taskId: 11,
    name: "TreeRC",
    posted: "Mar 2, 2026 08:10",
    start: "Mar 2, 2026 08:11",
    queued: "1m",
    took: "15s",
    result: false,
    err: "deadline exceeded",
    completedBy: "worker-02",
  },
];

const sampleStats: TaskStatView[] = [
  {
    name: "TreeRC",
    trueCount: 10,
    falseCount: 0,
    totalCount: 10,
    successRate: 100,
    runningMachines: 2,
  },
  {
    name: "SealSDR",
    trueCount: 4,
    falseCount: 3,
    totalCount: 7,
    successRate: 57.1,
    runningMachines: 1,
  },
];

describe("tasks filters", () => {
  it("filters out background tasks by default", () => {
    const rows = filterTaskSummaryRows(sampleSummary, {
      q: "",
      showBg: false,
      taskType: "",
    });

    expect(rows.map((row) => row.id)).toEqual([2]);
  });

  it("filters history rows by result and query", () => {
    const rows = filterTaskHistoryRows(sampleHistory, {
      q: "deadline",
      result: "failed",
      taskType: "",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.taskId).toBe(11);
  });

  it("coalesces similar active queue rows", () => {
    const rows = buildCoalescedQueueRows([
      {
        ...foregroundTask,
        id: 101,
      },
      {
        ...foregroundTask,
        id: 102,
      },
      {
        ...foregroundTask,
        id: 103,
      },
      {
        ...foregroundTask,
        id: 104,
      },
    ]);

    expect(rows).toHaveLength(3);
    expect(rows[0]?.kind).toBe("task");
    expect(rows[1]?.kind).toBe("coalesced");
    expect(rows[2]?.kind).toBe("task");
  });

  it("filters task stats by result and query", () => {
    const rows = filterTaskStatRows(sampleStats, {
      q: "seal",
      result: "failed",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("SealSDR");
  });
});
