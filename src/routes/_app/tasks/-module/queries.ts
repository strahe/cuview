import { useMemo } from "react";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { isCurioVersionAtLeast } from "@/utils/curio-version";
import {
  normalizeSingletonInfo,
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
  ApiSingletonInfo,
  ApiTaskDetail,
  ApiTaskHistoryEntry,
  ApiTaskHistorySummary,
  ApiTaskMachine,
  ApiTaskStat,
  ApiTaskStatus,
  ApiTaskSummary,
  SingletonInfoView,
} from "./types";

/** Stable empty array reference to prevent useMemo dependency churn when data is undefined. */
const EMPTY_ARRAY: never[] = [];

const selectTaskSummary = (data: ApiTaskSummary[]) =>
  data.map((row) => normalizeTaskSummary(row));

export const useTaskSummary = (options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
}) => {
  const query = useCurioRpc("ClusterTaskSummary", [], {
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval ?? 10_000,
    select: selectTaskSummary,
  });

  return { ...query, data: query.data ?? EMPTY_ARRAY };
};

const selectTaskHistory = (data: ApiTaskHistorySummary[]) =>
  data.map((row) => normalizeTaskHistorySummary(row));

export const useTaskHistory = (limit: number, offset: number) => {
  const query = useCurioRpc("ClusterTaskHistory", [limit, offset], {
    refetchInterval: 20_000,
    select: selectTaskHistory,
  });

  return { ...query, data: query.data ?? EMPTY_ARRAY };
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

const selectTaskTypeHistory = (data: ApiTaskHistoryEntry[]) =>
  data.map((row) => normalizeTaskHistoryEntry(row));

export const useTaskTypeHistory = (
  taskType: string,
  fails: boolean,
  options?: {
    enabled?: boolean;
  },
) => {
  const query = useCurioRpc("HarmonyTaskHistory", [taskType, fails], {
    enabled: (options?.enabled ?? true) && Boolean(taskType),
    refetchInterval: 30_000,
    select: selectTaskTypeHistory,
  });

  return { ...query, data: query.data ?? EMPTY_ARRAY };
};

const selectTaskStatus = (data: ApiTaskStatus | null) =>
  data ? normalizeTaskStatus(data) : null;
const selectTaskDetail = (data: ApiTaskDetail | null) =>
  data ? normalizeTaskDetail(data) : null;
const selectTaskHistoryById = (data: ApiTaskHistoryEntry[]) =>
  data.map((row) => normalizeTaskHistoryEntry(row));
const selectTaskMachines = (data: ApiTaskMachine[]) =>
  data.map((row) => normalizeTaskMachine(row));
const selectSingletonInfo = (data: ApiSingletonInfo | null) =>
  data ? normalizeSingletonInfo(data) : null;

export const useSingletonTaskInfo = (taskType: string) => {
  const hasTaskType = taskType.trim() !== "";
  const versionQuery = useCurioRpc<string>("Version", [], {
    refetchInterval: 300_000,
    staleTime: 300_000,
  });
  const supportsSingleton = isCurioVersionAtLeast(versionQuery.data, "1.27.4");
  const query = useCurioRpc<ApiSingletonInfo | null, SingletonInfoView | null>(
    "SingletonTaskInfo",
    [taskType],
    {
      enabled: supportsSingleton && hasTaskType,
      refetchInterval: 5_000,
      select: selectSingletonInfo,
    },
  );

  return {
    ...query,
    data: query.data ?? null,
    isLoading: hasTaskType && versionQuery.isLoading ? true : query.isLoading,
    error: versionQuery.error ?? query.error,
  };
};

export const useTaskDetailBundle = (params: {
  taskId: number | null;
  taskType: string;
  includeTaskTypeData?: boolean;
}) => {
  const hasTaskId = params.taskId !== null;
  const includeTaskTypeData = params.includeTaskTypeData ?? true;
  const hasTaskType = includeTaskTypeData && params.taskType.trim() !== "";

  const statusQuery = useCurioRpc("GetTaskStatus", [params.taskId ?? 0], {
    enabled: hasTaskId,
    refetchInterval: 10_000,
    select: selectTaskStatus,
  });

  const detailQuery = useCurioRpc("HarmonyTaskDetails", [params.taskId ?? 0], {
    enabled: hasTaskId,
    refetchInterval: 10_000,
    select: selectTaskDetail,
  });

  const historyByIdQuery = useCurioRpc(
    "HarmonyTaskHistoryById",
    [params.taskId ?? 0],
    {
      enabled: hasTaskId,
      refetchInterval: 20_000,
      select: selectTaskHistoryById,
    },
  );

  const machinesQuery = useCurioRpc("HarmonyTaskMachines", [params.taskType], {
    enabled: hasTaskType,
    refetchInterval: 30_000,
    select: selectTaskMachines,
  });

  const typeHistoryQuery = useTaskTypeHistory(params.taskType, false, {
    enabled: hasTaskType,
  });
  const typeFailedQuery = useTaskTypeHistory(params.taskType, true, {
    enabled: hasTaskType,
  });

  return {
    taskStatus: statusQuery.data ?? null,
    taskStatusLoading: statusQuery.isLoading,
    taskStatusError: statusQuery.error,
    taskDetail: detailQuery.data ?? null,
    taskDetailLoading: detailQuery.isLoading,
    taskDetailError: detailQuery.error,
    taskHistoryById: historyByIdQuery.data ?? EMPTY_ARRAY,
    taskHistoryByIdLoading: historyByIdQuery.isLoading,
    taskHistoryByIdError: historyByIdQuery.error,
    taskMachines: machinesQuery.data ?? EMPTY_ARRAY,
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

export const useSingletonRunNow = () =>
  useCurioRpcMutation("SingletonRunNow", {
    invalidateKeys: taskInvalidateKeys,
  });
