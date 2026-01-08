import { useMemo } from "react";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { formatBytes, formatNumber, formatPercentage } from "@/utils/format";
import type { ClusterMachine, HarmonyTaskStat } from "@/types/cluster";
import type { StorageUseStat } from "@/types/storage";
import type { ActorSummaryData } from "@/types/actor";
import type { TaskHistorySummary, TaskSummary } from "@/types/task";
import type { SyncerStateItem } from "@/types/sync";

export interface DashboardMetrics {
  machinesOnline: number;
  machinesTotal: number;
  machineHealth: number;
  runningTasks: number;
  taskSuccessRate: number;
  storageUsagePercent: number;
  storageUsedLabel: string;
  storageCapacityLabel: string;
  storageAvailableLabel: string;
  actorCount: number;
}

export interface HeroCard {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  status: "success" | "warning" | "info" | "accent";
}

export function useDashboardSummary() {
  const machines = useCurioRpc<ClusterMachine[]>("ClusterMachines", [], {
    refetchInterval: 30_000,
  });
  const taskStats = useCurioRpc<HarmonyTaskStat[]>("HarmonyTaskStats", [], {
    refetchInterval: 30_000,
  });
  const storageStats = useCurioRpc<StorageUseStat[]>("StorageUseStats", [], {
    refetchInterval: 60_000,
  });
  const actors = useCurioRpc<ActorSummaryData[]>("ActorSummary", [], {
    refetchInterval: 60_000,
  });
  const syncerState = useCurioRpc<SyncerStateItem[]>("SyncerState", [], {
    refetchInterval: 45_000,
  });
  const taskSummary = useCurioRpc<TaskSummary[]>("ClusterTaskSummary", [], {
    refetchInterval: 20_000,
  });
  const taskHistory = useCurioRpc<TaskHistorySummary[]>(
    "ClusterTaskHistory",
    [20, 0],
    { refetchInterval: 20_000 },
  );

  const loading =
    machines.isLoading ||
    taskStats.isLoading ||
    storageStats.isLoading ||
    actors.isLoading;

  const metrics = useMemo<DashboardMetrics>(() => {
    const machineList = machines.data ?? [];
    const online = machineList.filter((m) => !m.Unschedulable).length;
    const total = machineList.length;
    const health = total === 0 ? 0 : (online / total) * 100;

    const activeCount = taskSummary.data?.length ?? 0;
    const machineRunning = machineList.reduce(
      (sum, m) => sum + (m.RunningTasks || 0),
      0,
    );
    const running = activeCount > 0 ? activeCount : machineRunning;

    const stats = taskStats.data ?? [];
    const totals = stats.reduce(
      (acc, s) => ({
        success: acc.success + s.TrueCount,
        total: acc.total + s.TotalCount,
      }),
      { success: 0, total: 0 },
    );
    const successRate =
      totals.total === 0 ? 0 : (totals.success / totals.total) * 100;

    const storageList = storageStats.data ?? [];
    const capacity = storageList.reduce((sum, s) => sum + s.Capacity, 0);
    const available = storageList.reduce((sum, s) => sum + s.Available, 0);
    const used = Math.max(capacity - available, 0);
    const usagePercent = capacity === 0 ? 0 : (used / capacity) * 100;

    return {
      machinesOnline: online,
      machinesTotal: total,
      machineHealth: health,
      runningTasks: running,
      taskSuccessRate: successRate,
      storageUsagePercent: usagePercent,
      storageUsedLabel: formatBytes(used),
      storageCapacityLabel: formatBytes(capacity),
      storageAvailableLabel: formatBytes(available),
      actorCount: actors.data?.length ?? 0,
    };
  }, [machines.data, taskStats.data, storageStats.data, actors.data, taskSummary.data]);

  const heroCards = useMemo<HeroCard[]>(
    () => [
      {
        id: "machines",
        label: "Machines Online",
        value: `${metrics.machinesOnline}/${metrics.machinesTotal}`,
        subtitle: `Health ${formatPercentage(metrics.machineHealth, 0)}`,
        status: metrics.machineHealth >= 80 ? "success" : "warning",
      },
      {
        id: "tasks",
        label: "Active Tasks",
        value: formatNumber(metrics.runningTasks),
        subtitle: `Success ${formatPercentage(metrics.taskSuccessRate, 1)}`,
        status: "accent",
      },
      {
        id: "storage",
        label: "Storage Used",
        value: metrics.storageUsedLabel,
        subtitle: `Total ${metrics.storageCapacityLabel}`,
        status: "info",
      },
      {
        id: "actors",
        label: "Storage Providers",
        value: formatNumber(metrics.actorCount),
        subtitle: "Registered actors",
        status: "success",
      },
    ],
    [metrics],
  );

  const endpointIssues = useMemo(
    () => (syncerState.data ?? []).filter((s) => !s.Reachable).length,
    [syncerState.data],
  );

  const recentTasks = useMemo(
    () => (taskHistory.data ?? []).slice(0, 20),
    [taskHistory.data],
  );

  const refresh = async () => {
    await Promise.all([
      machines.refetch(),
      taskStats.refetch(),
      storageStats.refetch(),
      actors.refetch(),
      syncerState.refetch(),
      taskSummary.refetch(),
      taskHistory.refetch(),
    ]);
  };

  return {
    loading,
    metrics,
    heroCards,
    endpointIssues,
    recentTasks,
    recentTasksLoading: taskHistory.isLoading,
    recentTasksError: taskHistory.error,
    machines: machines.data ?? [],
    machinesLoading: machines.isLoading,
    taskStats: taskStats.data ?? [],
    taskStatsLoading: taskStats.isLoading,
    storageStats: storageStats.data ?? [],
    storageLoading: storageStats.isLoading,
    actors: actors.data ?? [],
    actorsLoading: actors.isLoading,
    syncerState: syncerState.data ?? [],
    syncLoading: syncerState.isLoading,
    refresh,
  };
}
