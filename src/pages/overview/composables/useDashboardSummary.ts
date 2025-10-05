import { computed } from "vue";
import { formatDistanceToNow } from "date-fns";
import { useCachedQuery } from "@/composables/useCachedQuery";
import type { ClusterMachine, HarmonyTaskStat } from "@/types/cluster";
import type { StorageUseStat } from "@/types/storage";
import type { SyncerStateItem } from "@/types/sync";
import type { ActorSummaryData } from "@/types/actor";
import type { TaskHistorySummary, TaskSummary } from "@/types/task";
import { formatBytes, formatNumber, formatPercentage } from "@/utils/format";

interface StorageTotals {
  capacity: number;
  available: number;
  used: number;
  usagePercent: number;
}

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

export interface DashboardStatus {
  label: string;
  variant: string;
  issues: number;
  endpointIssues: number;
  offlineMachines: number;
}

interface HeroCardSnapshot {
  id: "machines" | "tasks" | "storage" | "actors";
  label: string;
  value: string;
  subtitle: string;
  status: "success" | "warning" | "info" | "accent";
}

export interface HeroSnapshot {
  cards: HeroCardSnapshot[];
}

const calculateStorageTotals = (
  stats: StorageUseStat[] | null,
): StorageTotals => {
  if (!stats || stats.length === 0) {
    return {
      capacity: 0,
      available: 0,
      used: 0,
      usagePercent: 0,
    };
  }

  const capacity = stats.reduce((sum, stat) => sum + stat.Capacity, 0);
  const available = stats.reduce((sum, stat) => sum + stat.Available, 0);
  const used = Math.max(capacity - available, 0);
  const usagePercent = capacity === 0 ? 0 : (used / capacity) * 100;

  return {
    capacity,
    available,
    used,
    usagePercent,
  };
};

export const useDashboardSummary = () => {
  const {
    data: machines,
    loading: machinesLoading,
    error: machinesError,
    lastUpdated: machinesUpdated,
    refresh: refreshMachines,
  } = useCachedQuery<ClusterMachine[]>("ClusterMachines", [], {
    pollingInterval: 30000,
  });

  const {
    data: taskStats,
    loading: taskStatsLoading,
    error: taskStatsError,
    lastUpdated: taskStatsUpdated,
    refresh: refreshTaskStats,
  } = useCachedQuery<HarmonyTaskStat[]>("HarmonyTaskStats", [], {
    pollingInterval: 30000,
  });

  const {
    data: storageStats,
    loading: storageLoading,
    error: storageError,
    lastUpdated: storageUpdated,
    refresh: refreshStorage,
  } = useCachedQuery<StorageUseStat[]>("StorageUseStats", [], {
    pollingInterval: 60000,
  });

  const {
    data: actors,
    loading: actorsLoading,
    error: actorsError,
    lastUpdated: actorsUpdated,
    refresh: refreshActors,
  } = useCachedQuery<ActorSummaryData[]>("ActorSummary", [], {
    pollingInterval: 60000,
  });

  const {
    data: syncerState,
    loading: syncLoading,
    error: syncError,
    lastUpdated: syncUpdated,
    refresh: refreshSync,
  } = useCachedQuery<SyncerStateItem[]>("SyncerState", [], {
    pollingInterval: 45000,
  });

  const {
    data: taskSummary,
    loading: summaryLoading,
    error: summaryError,
    lastUpdated: summaryUpdated,
    refresh: refreshSummary,
  } = useCachedQuery<TaskSummary[]>("ClusterTaskSummary", [], {
    pollingInterval: 20000,
  });

  const {
    data: taskHistory,
    loading: recentTasksLoading,
    error: recentTasksError,
    lastUpdated: recentTasksUpdated,
    refresh: refreshRecentTasks,
  } = useCachedQuery<TaskHistorySummary[]>("ClusterTaskHistory", [20, 0], {
    pollingInterval: 20000,
  });

  const loadingState = computed(() => ({
    machines: machinesLoading.value,
    taskStats: taskStatsLoading.value,
    storage: storageLoading.value,
    actors: actorsLoading.value,
    sync: syncLoading.value,
    summary: summaryLoading.value,
    recentTasks: recentTasksLoading.value,
  }));

  const loading = computed(() =>
    Object.values(loadingState.value).some((flag) => flag),
  );

  const errorState = computed(() => ({
    machines: machinesError.value,
    taskStats: taskStatsError.value,
    storage: storageError.value,
    actors: actorsError.value,
    sync: syncError.value,
    summary: summaryError.value,
    recentTasks: recentTasksError.value,
  }));

  const error = computed(() => {
    for (const value of Object.values(errorState.value)) {
      if (value) {
        return value;
      }
    }
    return null;
  });

  const totalMachines = computed(() => machines.value?.length ?? 0);
  const onlineMachines = computed(() => {
    if (!machines.value) return 0;
    return machines.value.filter((machine) => !machine.Unschedulable).length;
  });

  const machineRunningTasks = computed(() => {
    if (!machines.value) return 0;
    return machines.value.reduce(
      (total, machine) => total + (machine.RunningTasks || 0),
      0,
    );
  });

  const activeTaskCount = computed(() => taskSummary.value?.length ?? 0);

  const runningTasks = computed(() =>
    activeTaskCount.value > 0
      ? activeTaskCount.value
      : machineRunningTasks.value,
  );

  const taskSuccessRate = computed(() => {
    if (!taskStats.value || taskStats.value.length === 0) return 0;
    const totals = taskStats.value.reduce(
      (acc, stat) => ({
        success: acc.success + stat.TrueCount,
        total: acc.total + stat.TotalCount,
      }),
      { success: 0, total: 0 },
    );

    if (totals.total === 0) return 0;
    return (totals.success / totals.total) * 100;
  });

  const storageTotals = computed(() =>
    calculateStorageTotals(storageStats.value),
  );

  const actorCount = computed(() => actors.value?.length ?? 0);

  const endpointIssues = computed(() => {
    if (!syncerState.value) return 0;
    return syncerState.value.filter((item) => !item.Reachable).length;
  });

  const offlineMachines = computed(() =>
    Math.max(totalMachines.value - onlineMachines.value, 0),
  );

  const status = computed<DashboardStatus>(() => {
    if (endpointIssues.value > 0) {
      return {
        label: `${endpointIssues.value} endpoint${
          endpointIssues.value > 1 ? "s" : ""
        } unreachable`,
        variant: "badge-error",
        issues: endpointIssues.value + offlineMachines.value,
        endpointIssues: endpointIssues.value,
        offlineMachines: offlineMachines.value,
      };
    }

    if (offlineMachines.value > 0) {
      return {
        label: `${offlineMachines.value} machine${
          offlineMachines.value > 1 ? "s" : ""
        } offline`,
        variant: "badge-warning",
        issues: offlineMachines.value,
        endpointIssues: 0,
        offlineMachines: offlineMachines.value,
      };
    }

    return {
      label: "All systems nominal",
      variant: "badge-success",
      issues: 0,
      endpointIssues: 0,
      offlineMachines: 0,
    };
  });

  const metrics = computed<DashboardMetrics>(() => ({
    machinesOnline: onlineMachines.value,
    machinesTotal: totalMachines.value,
    machineHealth:
      totalMachines.value === 0
        ? 0
        : (onlineMachines.value / totalMachines.value) * 100,
    runningTasks: runningTasks.value,
    taskSuccessRate: taskSuccessRate.value,
    storageUsagePercent: storageTotals.value.usagePercent,
    storageUsedLabel: formatBytes(storageTotals.value.used),
    storageCapacityLabel: formatBytes(storageTotals.value.capacity),
    storageAvailableLabel: formatBytes(storageTotals.value.available),
    actorCount: actorCount.value,
  }));

  const recentTasks = computed(() => {
    return taskHistory.value?.slice(0, 20) || [];
  });

  const lastUpdated = computed(() => {
    const timestamps = [
      machinesUpdated.value,
      taskStatsUpdated.value,
      storageUpdated.value,
      actorsUpdated.value,
      syncUpdated.value,
      summaryUpdated.value,
      recentTasksUpdated.value,
    ].filter(Boolean) as number[];

    if (timestamps.length === 0) {
      return 0;
    }

    return Math.max(...timestamps);
  });

  const lastUpdatedLabel = computed(() => {
    if (!lastUpdated.value) {
      return "Not updated yet";
    }

    return formatDistanceToNow(new Date(lastUpdated.value), {
      addSuffix: true,
    });
  });

  const formattedTaskSuccessRate = computed(() =>
    formatPercentage(metrics.value.taskSuccessRate, 1),
  );

  const machineHealthLabel = computed(() =>
    formatPercentage(metrics.value.machineHealth, 0),
  );

  const runningTasksLabel = computed(() =>
    formatNumber(metrics.value.runningTasks),
  );

  const heroSnapshot = computed<HeroSnapshot>(() => {
    return {
      cards: [
        {
          id: "machines",
          label: "Machines Online",
          value: `${metrics.value.machinesOnline}/${metrics.value.machinesTotal}`,
          subtitle: `Health ${machineHealthLabel.value}`,
          status: metrics.value.machineHealth >= 80 ? "success" : "warning",
        },
        {
          id: "tasks",
          label: "Active Tasks",
          value: runningTasksLabel.value,
          subtitle: `Success ${formattedTaskSuccessRate.value}`,
          status: "accent",
        },
        {
          id: "storage",
          label: "Storage Used",
          value: metrics.value.storageUsedLabel,
          subtitle: `Total ${metrics.value.storageCapacityLabel}`,
          status: "info",
        },
        {
          id: "actors",
          label: "Storage Providers",
          value: formatNumber(metrics.value.actorCount),
          subtitle: "Registered actors",
          status: "success",
        },
      ],
    };
  });

  const loadingSkeleton = computed(
    () =>
      loading.value &&
      !machines.value &&
      !taskStats.value &&
      !storageStats.value &&
      !actors.value,
  );

  const refresh = async () => {
    await Promise.all([
      refreshMachines(),
      refreshTaskStats(),
      refreshStorage(),
      refreshActors(),
      refreshSync(),
      refreshSummary(),
      refreshRecentTasks(),
    ]);
  };

  return {
    loading,
    loadingState,
    error,
    errorState,
    metrics,
    status,
    recentTasks,
    lastUpdatedLabel,
    formattedTaskSuccessRate,
    machineHealthLabel,
    runningTasksLabel,
    loadingSkeleton,
    recentTasksLoading,
    recentTasksError,
    heroSnapshot,
    refresh,
  };
};
