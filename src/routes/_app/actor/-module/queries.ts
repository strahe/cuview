import { useMemo } from "react";
import { useCurioRpc } from "@/hooks/use-curio-query";
import type {
  ActorDetail,
  ActorSummaryData,
  SectorBuckets,
} from "@/types/actor";
import type { WinStat } from "@/types/win";

export const useActorSummary = (options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
}) => {
  return useCurioRpc<ActorSummaryData[]>("ActorSummary", [], {
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval ?? 30_000,
  });
};

export const useActorInfo = (actorId: string) => {
  return useCurioRpc<ActorDetail>("ActorInfo", [actorId], {
    refetchInterval: 30_000,
    enabled: !!actorId,
  });
};

export const useActorCharts = (actorId: string) => {
  return useCurioRpc<SectorBuckets>("ActorCharts", [actorId], {
    refetchInterval: 60_000,
    enabled: !!actorId,
  });
};

export const useActorWinStats = () => {
  return useCurioRpc<WinStat[]>("WinStats", [], {
    refetchInterval: 60_000,
  });
};

export const useActorDetailBundle = (actorId: string) => {
  const info = useActorInfo(actorId);
  const charts = useActorCharts(actorId);
  const winStats = useActorWinStats();

  const actorWins = useMemo(
    () => winStats.data?.filter((w) => w.Miner === actorId) ?? [],
    [winStats.data, actorId],
  );

  return {
    info,
    charts,
    winStats,
    actorWins,
    isLoading: info.isLoading || charts.isLoading || winStats.isLoading,
  };
};
