import type {
  TaskHistorySummaryView,
  TaskQueueRow,
  TaskStatView,
  TaskSummaryView,
} from "./types";

const includesText = (value: string, q: string): boolean =>
  value.toLowerCase().includes(q);

export const filterTaskSummaryRows = (
  rows: TaskSummaryView[],
  filters: {
    q: string;
    showBg: boolean;
    taskType: string;
  },
): TaskSummaryView[] => {
  const query = filters.q.trim().toLowerCase();
  const taskType = filters.taskType.trim().toLowerCase();

  return rows.filter((row) => {
    if (!filters.showBg && row.isBackground) return false;
    if (taskType && row.name.toLowerCase() !== taskType) return false;
    if (!query) return true;

    return [
      row.name,
      row.miner,
      row.owner,
      row.spId,
      String(row.id),
      row.sincePostedStr,
    ].some((segment) => includesText(segment, query));
  });
};

export const filterTaskHistoryRows = (
  rows: TaskHistorySummaryView[],
  filters: {
    q: string;
    result: "all" | "success" | "failed";
    taskType: string;
  },
): TaskHistorySummaryView[] => {
  const query = filters.q.trim().toLowerCase();
  const taskType = filters.taskType.trim().toLowerCase();

  return rows.filter((row) => {
    if (filters.result === "success" && !row.result) return false;
    if (filters.result === "failed" && row.result) return false;
    if (taskType && row.name.toLowerCase() !== taskType) return false;
    if (!query) return true;

    return [
      row.name,
      row.err,
      row.completedBy,
      String(row.taskId),
      row.queued,
      row.took,
    ].some((segment) => includesText(segment, query));
  });
};

export const filterTaskStatRows = (
  rows: TaskStatView[],
  filters: {
    q: string;
    result: "all" | "success" | "failed";
  },
): TaskStatView[] => {
  const query = filters.q.trim().toLowerCase();

  return rows.filter((row) => {
    if (filters.result === "failed" && row.falseCount === 0) return false;
    if (filters.result === "success" && row.falseCount > 0) return false;
    if (!query) return true;

    return [
      row.name,
      String(row.totalCount),
      String(row.trueCount),
      String(row.falseCount),
    ].some((segment) => includesText(segment, query));
  });
};

const compareSpid = (a: string, b: string): number => {
  const aNum = Number.parseInt(a, 10);
  const bNum = Number.parseInt(b, 10);

  if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
  return a.localeCompare(b);
};

export const buildCoalescedQueueRows = (
  rows: TaskSummaryView[],
): TaskQueueRow[] => {
  const sorted = [...rows].sort((left, right) => {
    const taskName = left.name.localeCompare(right.name);
    if (taskName !== 0) return taskName;

    const spid = compareSpid(left.spId, right.spId);
    if (spid !== 0) return spid;

    return (left.ownerId ?? 0) - (right.ownerId ?? 0);
  });

  const groups: TaskSummaryView[][] = [];
  for (const row of sorted) {
    const previous = groups[groups.length - 1];
    const isSameGroup =
      previous &&
      previous[0]?.name === row.name &&
      previous[0]?.spId === row.spId &&
      (previous[0]?.ownerId ?? 0) === (row.ownerId ?? 0);

    if (isSameGroup) {
      previous.push(row);
      continue;
    }
    groups.push([row]);
  }

  return groups.flatMap((group) => {
    if (group.length <= 3) {
      return group.map((task) => ({
        kind: "task" as const,
        id: `task-${task.id}`,
        task,
      }));
    }

    const first = group[0];
    const last = group[group.length - 1];
    if (!first || !last) return [];

    return [
      {
        kind: "task" as const,
        id: `task-${first.id}`,
        task: first,
      },
      {
        kind: "coalesced" as const,
        id: `coalesced-${first.name}-${first.spId}-${first.ownerId ?? 0}-${group.length}`,
        taskName: first.name,
        spId: first.spId,
        ownerId: first.ownerId,
        count: group.length - 2,
      },
      {
        kind: "task" as const,
        id: `task-${last.id}`,
        task: last,
      },
    ];
  });
};
