import type {
  TaskResultFilter,
  TaskSearchPatch,
  TaskSearchState,
} from "./types";

export const DEFAULT_TASK_SEARCH: TaskSearchState = {
  q: "",
  showBg: false,
  coalesce: true,
  result: "all",
  taskType: "",
  taskId: null,
  limit: 100,
  offset: 0,
};

const parseBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "1" || normalized === "true" || normalized === "yes") {
      return true;
    }
    if (normalized === "0" || normalized === "false" || normalized === "no") {
      return false;
    }
  }
  return fallback;
};

const parsePositiveInt = (
  value: unknown,
  fallback: number,
  options?: { min?: number; max?: number },
): number => {
  const min = options?.min ?? 0;
  const max = options?.max ?? Number.POSITIVE_INFINITY;

  let parsed: number | null = null;
  if (typeof value === "number" && Number.isFinite(value)) parsed = value;
  if (typeof value === "string" && value.trim() !== "") {
    const stringParsed = Number.parseInt(value, 10);
    if (Number.isFinite(stringParsed)) parsed = stringParsed;
  }

  if (parsed === null || parsed < min) return fallback;
  return Math.min(parsed, max);
};

const parseTaskResult = (value: unknown): TaskResultFilter => {
  if (value === "success" || value === "failed" || value === "all")
    return value;
  return "all";
};

export const normalizeTaskSearch = (search: Record<string, unknown>) => {
  const q = typeof search.q === "string" ? search.q : DEFAULT_TASK_SEARCH.q;
  const taskType =
    typeof search.taskType === "string"
      ? search.taskType
      : DEFAULT_TASK_SEARCH.taskType;

  const taskId = parsePositiveInt(search.taskId, 0, { min: 0 });

  return {
    q: q.trim(),
    showBg: parseBoolean(search.showBg, DEFAULT_TASK_SEARCH.showBg),
    coalesce: parseBoolean(search.coalesce, DEFAULT_TASK_SEARCH.coalesce),
    result: parseTaskResult(search.result),
    taskType: taskType.trim(),
    taskId: taskId > 0 ? taskId : null,
    limit: parsePositiveInt(search.limit, DEFAULT_TASK_SEARCH.limit, {
      min: 1,
      max: 500,
    }),
    offset: parsePositiveInt(search.offset, DEFAULT_TASK_SEARCH.offset, {
      min: 0,
    }),
  } satisfies TaskSearchState;
};

export const patchTaskSearch = (
  prev: TaskSearchState,
  patch: TaskSearchPatch,
): TaskSearchState => {
  const merged = normalizeTaskSearch({ ...prev, ...patch });

  const resetOffset =
    patch.q !== undefined ||
    patch.showBg !== undefined ||
    patch.coalesce !== undefined ||
    patch.result !== undefined ||
    patch.taskType !== undefined ||
    patch.limit !== undefined;

  if (patch.offset !== undefined) {
    merged.offset = parsePositiveInt(patch.offset, prev.offset, { min: 0 });
  } else if (resetOffset) {
    merged.offset = 0;
  } else {
    merged.offset = prev.offset;
  }

  return merged;
};
