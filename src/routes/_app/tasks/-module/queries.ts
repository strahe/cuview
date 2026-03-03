import { useMemo } from "react";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import {
  normalizeTaskDetail,
  normalizeTaskHistoryEntry,
  normalizeTaskHistorySummary,
  normalizeTaskMachine,
  normalizeTaskStat,
  normalizeTaskStatus,
  normalizeTaskSummary,
} from "./adapters";
import { taskInvalidateKeys } from "./query-keys";
import type {
  ApiTaskDetail,
  ApiTaskHistoryEntry,
  ApiTaskHistorySummary,
  ApiTaskMachine,
  ApiTaskStat,
  ApiTaskStatus,
  ApiTaskSummary,
} from "./types";

export const useTaskSummary = (options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
}) => {
  const query = useCurioRpc<ApiTaskSummary[]>("ClusterTaskSummary", [], {
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval ?? 10_000,
  });

  const data = useMemo(
    () => (query.data ?? []).map((row) => normalizeTaskSummary(row)),
    [query.data],
  );

  return { ...query, data };
};

export const useTaskHistory = (limit: number, offset: number) => {
  const query = useCurioRpc<ApiTaskHistorySummary[]>(
    "ClusterTaskHistory",
    [limit, offset],
    { refetchInterval: 20_000 },
  );

  const data = useMemo(
    () => (query.data ?? []).map((row) => normalizeTaskHistorySummary(row)),
    [query.data],
  );

  return { ...query, data };
};

export const useTaskStats = () => {
  const statsQuery = useCurioRpc<ApiTaskStat[]>("HarmonyTaskStats", [], {
    refetchInterval: 30_000,
  });
  const summaryQuery = useTaskSummary({ refetchInterval: 10_000 });

  const runningMachinesByTaskName = useMemo(() => {
    const bucket = new Map<string, Set<number>>();
    for (const task of summaryQuery.data) {
      const ownerId = task.ownerId;
      if (!ownerId) continue;
      const set = bucket.get(task.name) ?? new Set<number>();
      set.add(ownerId);
      bucket.set(task.name, set);
    }

    return new Map<string, number>(
      [...bucket.entries()].map(([name, owners]) => [name, owners.size]),
    );
  }, [summaryQuery.data]);

  const data = useMemo(
    () =>
      (statsQuery.data ?? []).map((row) =>
        normalizeTaskStat(
          row,
          runningMachinesByTaskName.get(row.Name ?? row.name ?? "") ?? 0,
        ),
      ),
    [statsQuery.data, runningMachinesByTaskName],
  );

  return {
    ...statsQuery,
    data,
    summaryData: summaryQuery.data,
    summaryLoading: summaryQuery.isLoading,
  };
};

export const useTaskTypeHistory = (
  taskType: string,
  fails: boolean,
  options?: {
    enabled?: boolean;
  },
) => {
  const query = useCurioRpc<ApiTaskHistoryEntry[]>(
    "HarmonyTaskHistory",
    [taskType, fails],
    {
      enabled: (options?.enabled ?? true) && Boolean(taskType),
      refetchInterval: 30_000,
    },
  );

  const data = useMemo(
    () => (query.data ?? []).map((row) => normalizeTaskHistoryEntry(row)),
    [query.data],
  );

  return { ...query, data };
};

export const useTaskDetailBundle = (params: {
  taskId: number | null;
  taskType: string;
  includeTaskTypeData?: boolean;
}) => {
  const hasTaskId = params.taskId !== null;
  const includeTaskTypeData = params.includeTaskTypeData ?? true;
  const hasTaskType = includeTaskTypeData && params.taskType.trim() !== "";

  const statusQuery = useCurioRpc<ApiTaskStatus>(
    "GetTaskStatus",
    [params.taskId ?? 0],
    {
      enabled: hasTaskId,
      refetchInterval: 10_000,
    },
  );

  const detailQuery = useCurioRpc<ApiTaskDetail>(
    "HarmonyTaskDetails",
    [params.taskId ?? 0],
    {
      enabled: hasTaskId,
      refetchInterval: 10_000,
    },
  );

  const historyByIdQuery = useCurioRpc<ApiTaskHistoryEntry[]>(
    "HarmonyTaskHistoryById",
    [params.taskId ?? 0],
    {
      enabled: hasTaskId,
      refetchInterval: 20_000,
    },
  );

  const machinesQuery = useCurioRpc<ApiTaskMachine[]>(
    "HarmonyTaskMachines",
    [params.taskType],
    {
      enabled: hasTaskType,
      refetchInterval: 30_000,
    },
  );

  const typeHistoryQuery = useTaskTypeHistory(params.taskType, false, {
    enabled: hasTaskType,
  });
  const typeFailedQuery = useTaskTypeHistory(params.taskType, true, {
    enabled: hasTaskType,
  });

  return {
    taskStatus: statusQuery.data ? normalizeTaskStatus(statusQuery.data) : null,
    taskStatusLoading: statusQuery.isLoading,
    taskStatusError: statusQuery.error,
    taskDetail: detailQuery.data ? normalizeTaskDetail(detailQuery.data) : null,
    taskDetailLoading: detailQuery.isLoading,
    taskDetailError: detailQuery.error,
    taskHistoryById: (historyByIdQuery.data ?? []).map((row) =>
      normalizeTaskHistoryEntry(row),
    ),
    taskHistoryByIdLoading: historyByIdQuery.isLoading,
    taskHistoryByIdError: historyByIdQuery.error,
    taskMachines: (machinesQuery.data ?? []).map((row) =>
      normalizeTaskMachine(row),
    ),
    taskMachinesLoading: machinesQuery.isLoading,
    taskMachinesError: machinesQuery.error,
    taskTypeHistory: typeHistoryQuery.data,
    taskTypeHistoryLoading: typeHistoryQuery.isLoading,
    taskTypeHistoryError: typeHistoryQuery.error,
    taskTypeFailedHistory: typeFailedQuery.data,
    taskTypeFailedHistoryLoading: typeFailedQuery.isLoading,
    taskTypeFailedHistoryError: typeFailedQuery.error,
  };
};

export const useRestartFailedTask = () =>
  useCurioRpcMutation("RestartFailedTask", {
    invalidateKeys: taskInvalidateKeys,
  });
