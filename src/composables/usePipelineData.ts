import { computed } from "vue";
import { useCurioQuery } from "./useCurioQuery";
import type {
  SectorListEntry,
  PorepPipelineSummary,
  PipelineStats,
  PipelineFailedStats,
  PipelineOverviewStats,
} from "@/types/pipeline";

export function usePipelineData() {
  const {
    pipelinePorepSectors,
    porepPipelineSummary,
    pipelineStatsSDR,
    pipelineStatsSnap,
    pipelineFailedTasksMarket,
    pipelinePorepRestartAll,
    pipelineSnapRestartAll,
  } = useCurioQuery();

  // PoRep Pipeline Data
  const porepSectors = pipelinePorepSectors();
  const porepSummary = porepPipelineSummary();
  const porepStats = pipelineStatsSDR();

  // Snap Pipeline Data
  const snapStats = pipelineStatsSnap();

  // Failed tasks data
  const failedTasks = pipelineFailedTasksMarket();

  // Computed overview stats
  const overviewStats = computed<PipelineOverviewStats | null>(() => {
    if (!porepStats.data.value || !snapStats.data.value) return null;

    return {
      porepStats: porepStats.data.value as PipelineStats,
      snapStats: snapStats.data.value as PipelineStats,
      totalActiveSectors:
        ((porepStats.data.value as PipelineStats)?.InProgressSectors || 0) +
        ((snapStats.data.value as PipelineStats)?.InProgressSectors || 0),
      totalFailedTasks:
        ((porepStats.data.value as PipelineStats)?.FailedSectors || 0) +
        ((snapStats.data.value as PipelineStats)?.FailedSectors || 0),
      lastUpdate: new Date().toISOString(),
    };
  });

  // Actions
  const restartPorepPipeline = async () => {
    try {
      await pipelinePorepRestartAll();
      await Promise.all([
        porepSectors.refresh(),
        porepSummary.refresh(),
        porepStats.refresh(),
      ]);
      return { success: true };
    } catch (error) {
      console.error("Failed to restart PoRep pipeline:", error);
      return { success: false, error: error as Error };
    }
  };

  const restartSnapPipeline = async () => {
    try {
      await pipelineSnapRestartAll();
      await snapStats.refresh();
      return { success: true };
    } catch (error) {
      console.error("Failed to restart Snap pipeline:", error);
      return { success: false, error: error as Error };
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      porepSectors.refresh(),
      porepSummary.refresh(),
      porepStats.refresh(),
      snapStats.refresh(),
      failedTasks.refresh(),
    ]);
  };

  return {
    // PoRep data
    porepSectors: {
      data: porepSectors.data as import("vue").Ref<SectorListEntry[] | null>,
      loading: porepSectors.loading,
      error: porepSectors.error,
      refresh: porepSectors.refresh,
    },
    porepSummary: {
      data: porepSummary.data as import("vue").Ref<
        PorepPipelineSummary[] | null
      >,
      loading: porepSummary.loading,
      error: porepSummary.error,
      refresh: porepSummary.refresh,
    },
    porepStats: {
      data: porepStats.data as import("vue").Ref<PipelineStats | null>,
      loading: porepStats.loading,
      error: porepStats.error,
      refresh: porepStats.refresh,
    },

    // Snap data
    snapStats: {
      data: snapStats.data as import("vue").Ref<PipelineStats | null>,
      loading: snapStats.loading,
      error: snapStats.error,
      refresh: snapStats.refresh,
    },

    // Failed tasks
    failedTasks: {
      data: failedTasks.data as import("vue").Ref<PipelineFailedStats | null>,
      loading: failedTasks.loading,
      error: failedTasks.error,
      refresh: failedTasks.refresh,
    },

    // Overview computed data
    overviewStats,

    // Actions
    restartPorepPipeline,
    restartSnapPipeline,
    refreshAll,
  };
}
