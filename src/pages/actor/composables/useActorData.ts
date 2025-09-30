import { useCachedQuery } from "@/composables/useCachedQuery";
import type {
  ActorSummaryData,
  ActorDetail,
  SectorBuckets,
} from "@/types/actor";

export function useActorSummary() {
  const {
    data: actors,
    loading,
    error,
    refresh,
  } = useCachedQuery<ActorSummaryData[]>("ActorSummary", [], {
    pollingInterval: 30000, // Refresh every 30 seconds
  });

  return {
    actors,
    loading,
    error,
    refresh,
  };
}

export function useActorDetail(actorId: string) {
  const {
    data: actorDetail,
    loading,
    error,
    refresh,
  } = useCachedQuery<ActorDetail>("ActorInfo", [actorId], {
    pollingInterval: 30000, // Refresh every 30 seconds
  });

  return {
    actorDetail,
    loading,
    error,
    refresh,
  };
}

export function useActorCharts(address: string) {
  const {
    data: sectorBuckets,
    loading,
    error,
    refresh,
  } = useCachedQuery<SectorBuckets>("ActorCharts", [address], {
    pollingInterval: 60000, // Refresh every 60 seconds
  });

  return {
    sectorBuckets,
    loading,
    error,
    refresh,
  };
}
