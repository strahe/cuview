import { useMemo } from "react";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import type {
  PipelineWaterfallStats,
  PorepPipelineSummary,
  SectorListEntry,
  SnapSectorEntry,
} from "@/types/pipeline";
import {
  buildPorepActorRows,
  buildSnapActorRows,
  computePorepTotals,
  computeSnapTotals,
  normalizePorepSector,
  normalizeSnapSector,
} from "./adapters";
import { porepInvalidateKeys, snapInvalidateKeys } from "./query-keys";
import type { SnapSectorView } from "./types";

// ---------------------------------------------------------------------------
// PoRep queries
// ---------------------------------------------------------------------------

export function usePorepSectors() {
  const query = useCurioRpc<SectorListEntry[]>("PipelinePorepSectors", [], {
    refetchInterval: 30_000,
  });

  const data = useMemo(
    () => (query.data ?? []).map(normalizePorepSector),
    [query.data],
  );

  return { ...query, data };
}

export function usePorepSummary() {
  const query = useCurioRpc<PorepPipelineSummary[]>(
    "PorepPipelineSummary",
    [],
    { refetchInterval: 30_000 },
  );

  const totals = useMemo(
    () => (query.data ? computePorepTotals(query.data) : null),
    [query.data],
  );

  const actorRows = useMemo(
    () => (query.data ? buildPorepActorRows(query.data) : []),
    [query.data],
  );

  return { ...query, totals, actorRows };
}

export function usePorepRestartAll() {
  return useCurioRpcMutation("PipelinePorepRestartAll", {
    invalidateKeys: porepInvalidateKeys,
  });
}

export function usePorepSectorAction(method: string) {
  return useCurioRpcMutation(method, {
    invalidateKeys: porepInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// Snap queries
// ---------------------------------------------------------------------------

export function useSnapSectors() {
  const query = useCurioRpc<SnapSectorEntry[]>("UpgradeSectors", [], {
    refetchInterval: 30_000,
  });

  const data = useMemo(
    () => (query.data ?? []).map(normalizeSnapSector),
    [query.data],
  );

  return { ...query, data };
}

export function useSnapStats() {
  return useCurioRpc<PipelineWaterfallStats>("PipelineStatsSnap", [], {
    refetchInterval: 30_000,
  });
}

export function useSnapSummary(
  stats: PipelineWaterfallStats | undefined,
  sectors: SnapSectorView[] | undefined,
) {
  const rawSectors = useMemo(
    () => sectors?.map((sector) => sector.raw) ?? [],
    [sectors],
  );

  const totals = useMemo(
    () => computeSnapTotals(stats, rawSectors),
    [stats, rawSectors],
  );
  const actorRows = useMemo(() => buildSnapActorRows(rawSectors), [rawSectors]);

  return { totals, actorRows };
}

export function useSnapRestartAll() {
  return useCurioRpcMutation("PipelineSnapRestartAll", {
    invalidateKeys: snapInvalidateKeys,
  });
}

export function useSnapDelete() {
  return useCurioRpcMutation("UpgradeDelete", {
    invalidateKeys: snapInvalidateKeys,
  });
}

export function useSnapResetTasks() {
  return useCurioRpcMutation("UpgradeResetTaskIDs", {
    invalidateKeys: snapInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// Pipeline stats queries (stats page)
// ---------------------------------------------------------------------------

export function usePipelineStats() {
  const sdr = useCurioRpc<PipelineWaterfallStats>("PipelineStatsSDR", [], {
    refetchInterval: 30_000,
  });
  const snap = useCurioRpc<PipelineWaterfallStats>("PipelineStatsSnap", [], {
    refetchInterval: 30_000,
  });
  const market = useCurioRpc<PipelineWaterfallStats>(
    "PipelineStatsMarket",
    [],
    { refetchInterval: 30_000 },
  );

  return {
    sdrStats: sdr.data,
    sdrLoading: sdr.isLoading,
    snapStats: snap.data,
    snapLoading: snap.isLoading,
    marketStats: market.data,
    marketLoading: market.isLoading,
  };
}
