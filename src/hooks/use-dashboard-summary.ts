import { useMemo } from "react";
import { useCurioRpc } from "@/hooks/use-curio-query";
import type { ActorSummaryData } from "@/types/actor";
import type { ClusterMachine, HarmonyTaskStat } from "@/types/cluster";
import type { PipelineWaterfallStats } from "@/types/pipeline";
import type { StorageUseStat } from "@/types/storage";
import type { SyncerStateItem } from "@/types/sync";
import type { TaskHistorySummary, TaskSummary } from "@/types/task";
import type { WalletInfo } from "@/types/wallet";
import { formatBytes, formatNumber, formatPercentage } from "@/utils/format";

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
  totalQaP: string;
  totalRawPower: string;
  wins1d: number;
  wins7d: number;
  wins30d: number;
  pipelineActive: number;
  pipelinePorepActive: number;
  pipelineSnapActive: number;
  pipelineFailed: number;
  alertPending: number;
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
  const alertPending = useCurioRpc<number>("AlertPendingCount", [], {
    refetchInterval: 15_000,
  });
  const pipelinePorepStats = useCurioRpc<PipelineWaterfallStats>(
    "PipelineStatsSDR",
    [],
    { refetchInterval: 30_000 },
  );
  const pipelineSnapStats = useCurioRpc<PipelineWaterfallStats>(
    "PipelineStatsSnap",
    [],
    { refetchInterval: 30_000 },
  );
  const wallets = useCurioRpc<WalletInfo[]>("Wallets", [], {
    refetchInterval: 60_000,
  });

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

    // Aggregate actor power and wins
    const actorList = actors.data ?? [];
    let totalQaP = BigInt(0);
    let totalRaw = BigInt(0);
    let w1 = 0;
    let w7 = 0;
    let w30 = 0;
    for (const a of actorList) {
      try {
        totalQaP += BigInt(a.QualityAdjustedPower || "0");
      } catch {
        /* ignore parse errors */
      }
      try {
        totalRaw += BigInt(a.RawBytePower || "0");
      } catch {
        /* ignore parse errors */
      }
      w1 += a.Win1 || 0;
      w7 += a.Win7 || 0;
      w30 += a.Win30 || 0;
    }

    // Pipeline active counts
    const porepActive = pipelinePorepStats.data?.Total ?? 0;
    const snapActive = pipelineSnapStats.data?.Total ?? 0;
    const porepFailed =
      pipelinePorepStats.data?.Stages?.find((s) => s.Name === "Failed")
        ?.Pending ?? 0;
    const snapFailed =
      pipelineSnapStats.data?.Stages?.find((s) => s.Name === "Failed")
        ?.Pending ?? 0;

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
      actorCount: actorList.length,
      totalQaP: formatPower(totalQaP),
      totalRawPower: formatPower(totalRaw),
      wins1d: w1,
      wins7d: w7,
      wins30d: w30,
      pipelineActive: porepActive + snapActive,
      pipelinePorepActive: porepActive,
      pipelineSnapActive: snapActive,
      pipelineFailed: porepFailed + snapFailed,
      alertPending: alertPending.data ?? 0,
    };
  }, [
    machines.data,
    taskStats.data,
    storageStats.data,
    actors.data,
    taskSummary.data,
    pipelinePorepStats.data,
    pipelineSnapStats.data,
    alertPending.data,
  ]);

  const heroCards = useMemo<HeroCard[]>(
    () => [
      {
        id: "power",
        label: "Total Power",
        value: metrics.totalQaP,
        subtitle: `Raw ${metrics.totalRawPower}`,
        status: "info",
      },
      {
        id: "wins",
        label: "Block Wins (24h)",
        value: formatNumber(metrics.wins1d),
        subtitle: `7d: ${metrics.wins7d} · 30d: ${metrics.wins30d}`,
        status: metrics.wins1d > 0 ? "success" : "warning",
      },
      {
        id: "machines",
        label: "Machines",
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
        label: "Storage",
        value: metrics.storageUsedLabel,
        subtitle: `of ${metrics.storageCapacityLabel}`,
        status:
          metrics.storageUsagePercent >= 95
            ? "warning"
            : metrics.storageUsagePercent >= 80
              ? "info"
              : "success",
      },
      {
        id: "pipeline",
        label: "Pipeline",
        value: formatNumber(metrics.pipelineActive),
        subtitle: `PoRep: ${metrics.pipelinePorepActive} · Snap: ${metrics.pipelineSnapActive}`,
        status: metrics.pipelineFailed > 0 ? "warning" : "info",
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
      alertPending.refetch(),
      pipelinePorepStats.refetch(),
      pipelineSnapStats.refetch(),
      wallets.refetch(),
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
    pipelinePorepStats: pipelinePorepStats.data ?? null,
    pipelineSnapStats: pipelineSnapStats.data ?? null,
    pipelineLoading:
      pipelinePorepStats.isLoading || pipelineSnapStats.isLoading,
    wallets: wallets.data ?? [],
    walletsLoading: wallets.isLoading,
    refresh,
  };
}

/** Format bigint power to human-readable string (e.g., "15.2 PiB") */
function formatPower(bytes: bigint): string {
  if (bytes === BigInt(0)) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"];
  const k = BigInt(1024);
  let unitIndex = 0;
  let current = bytes;
  while (current >= k * BigInt(1024) && unitIndex < units.length - 1) {
    current = current / k;
    unitIndex++;
  }
  // Final division with decimal precision
  const whole = Number(current / k);
  const remainder = Number((current % k) * BigInt(100)) / Number(k);
  unitIndex++;
  if (unitIndex >= units.length) {
    return `${whole} ${units[units.length - 1]}`;
  }
  const val = whole + remainder / 100;
  return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}
