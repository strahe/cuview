import type {
  ApiTaskDetail,
  ApiTaskHistoryEntry,
  ApiTaskHistorySummary,
  ApiTaskMachine,
  ApiTaskStat,
  ApiTaskStatus,
  ApiTaskSummary,
  TaskDetailView,
  TaskHistoryEntryView,
  TaskHistorySummaryView,
  TaskMachineView,
  TaskRuntimeStatus,
  TaskStatusView,
  TaskStatView,
  TaskSummaryView,
} from "./types";

const INTEGER_PATTERN = /^-?\d+$/;

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isSafeInteger(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const trimmed = value.trim();
    if (!INTEGER_PATTERN.test(trimmed)) return null;

    const parsed = Number(trimmed);
    if (Number.isSafeInteger(parsed)) return parsed;
  }

  return null;
};

const asText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const asBool = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

const normalizeRuntimeStatus = (status: string): TaskRuntimeStatus => {
  const normalized = status.trim().toLowerCase();
  if (
    normalized === "pending" ||
    normalized === "running" ||
    normalized === "done" ||
    normalized === "failed"
  ) {
    return normalized;
  }
  return "unknown";
};

const formatDurationBetween = (start: string, end: string): string => {
  const startTs = new Date(start).getTime();
  const endTs = new Date(end).getTime();
  if (
    !Number.isFinite(startTs) ||
    !Number.isFinite(endTs) ||
    endTs <= startTs
  ) {
    return "0s";
  }

  const seconds = Math.floor((endTs - startTs) / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  if (minutes < 60)
    return remSeconds > 0 ? `${minutes}m ${remSeconds}s` : `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
};

export const normalizeTaskSummary = (raw: ApiTaskSummary): TaskSummaryView => {
  const id = asNumber(raw.ID ?? raw.id) ?? 0;
  const ownerId = asNumber(raw.OwnerID ?? raw.owner_id);
  const owner = asText(raw.Owner ?? raw.owner);
  const name = asText(raw.Name ?? raw.name);
  return {
    id,
    name,
    spId: asText(raw.SpID ?? raw.sp_id),
    miner: asText(raw.Miner ?? raw.miner),
    sincePosted: asText(raw.SincePosted ?? raw.since_posted),
    sincePostedStr: asText(raw.SincePostedStr ?? raw.since_posted_str),
    owner,
    ownerId,
    status: owner ? "running" : "pending",
    isBackground: name.startsWith("bg:"),
  };
};

export const normalizeTaskHistorySummary = (
  raw: ApiTaskHistorySummary,
): TaskHistorySummaryView => ({
  taskId: asNumber(raw.TaskID ?? raw.task_id) ?? 0,
  name: asText(raw.Name ?? raw.name),
  posted: asText(raw.Posted ?? raw.posted),
  start: asText(raw.Start ?? raw.start),
  queued: asText(raw.Queued ?? raw.queued),
  took: asText(raw.Took ?? raw.took),
  result: asBool(raw.Result ?? raw.result),
  err: asText(raw.Err ?? raw.err),
  completedBy: asText(raw.CompletedBy ?? raw.completed_by),
});

export const normalizeTaskStatus = (raw: ApiTaskStatus): TaskStatusView => ({
  taskId: asNumber(raw.task_id ?? raw.TaskID) ?? 0,
  status: normalizeRuntimeStatus(asText(raw.status ?? raw.Status)),
  ownerId: asNumber(raw.owner_id ?? raw.OwnerID),
  name: asText(raw.name ?? raw.Name),
  postedAt: asText(raw.posted_at ?? raw.PostedAt) || null,
});

export const normalizeTaskMachine = (raw: ApiTaskMachine): TaskMachineView => ({
  machineId: asNumber(raw.machine_id ?? raw.MachineID) ?? 0,
  name: asText(raw.machine_name ?? raw.Name),
  address: asText(raw.host_and_port ?? raw.MachineAddr),
  actors: asText(raw.miners ?? raw.Actors),
});

export const normalizeTaskStat = (
  raw: ApiTaskStat,
  runningMachines = 0,
): TaskStatView => {
  const trueCount = asNumber(raw.TrueCount ?? raw.true_count) ?? 0;
  const falseCount = asNumber(raw.FalseCount ?? raw.false_count) ?? 0;
  const totalCount = asNumber(raw.TotalCount ?? raw.total_count) ?? 0;
  const successRate = totalCount === 0 ? 0 : (trueCount / totalCount) * 100;

  return {
    name: asText(raw.Name ?? raw.name),
    trueCount,
    falseCount,
    totalCount,
    successRate,
    runningMachines,
  };
};

export const normalizeTaskDetail = (raw: ApiTaskDetail): TaskDetailView => ({
  id: asNumber(raw.ID ?? raw.id) ?? 0,
  name: asText(raw.Name ?? raw.name),
  updateTime: asText(raw.UpdateTime ?? raw.update_time),
  postedTime: asText(raw.PostedTime ?? raw.posted_time),
  ownerId: asNumber(raw.OwnerID ?? raw.owner_id),
  ownerAddr: asText(raw.OwnerAddr ?? raw.owner_addr),
  ownerName: asText(raw.OwnerName ?? raw.owner_name),
});

export const normalizeTaskHistoryEntry = (
  raw: ApiTaskHistoryEntry,
): TaskHistoryEntryView => {
  const workStart = asText(raw.WorkStart ?? raw.work_start);
  const workEnd = asText(raw.WorkEnd ?? raw.work_end);
  const tookValue = asText(raw.Took ?? raw.took);

  return {
    id: asNumber(raw.ID ?? raw.id) ?? 0,
    taskId: asNumber(raw.TaskID ?? raw.task_id) ?? 0,
    name: asText(raw.Name ?? raw.name),
    workStart,
    workEnd,
    posted: asText(raw.Posted ?? raw.posted),
    took: tookValue || formatDurationBetween(workStart, workEnd),
    result: asBool(raw.Result ?? raw.result),
    err: asText(raw.Err ?? raw.err),
    completedBy: asText(raw.CompletedBy ?? raw.completed_by_host_and_port),
    completedById: asNumber(raw.CompletedById ?? raw.completed_by_machine),
    completedByName: asText(
      raw.CompletedByName ?? raw.completed_by_machine_name,
    ),
    eventCount: Array.isArray(raw.Events) ? raw.Events.length : 0,
  };
};
