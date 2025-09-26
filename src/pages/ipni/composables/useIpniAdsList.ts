import { computed, ref, watch } from "vue";
import { useCurioQuery } from "@/composables/useCurioQuery";
import { useIpniSummary } from "@/composables/useIpniSummary";
import type { IpniAdDetail, IpniAdFailure, IpniAdRow } from "@/types/ipni";

interface ProviderSnapshot {
  miner: string;
  peerId: string;
  head: string | null;
}

export const useIpniAdsList = () => {
  const { call } = useCurioQuery();
  const {
    providers,
    refresh: refreshSummary,
    loading: summaryLoading,
  } = useIpniSummary();

  const ads = ref<IpniAdRow[]>([]);
  const failures = ref<IpniAdFailure[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const lastUpdated = ref<number | null>(null);

  let requestId = 0;
  let skipWatchFetch = false;

  const fetchAds = async () => {
    requestId += 1;
    const currentReq = requestId;
    loading.value = true;
    error.value = null;

    try {
      const snapshot: ProviderSnapshot[] = providers.value.map((provider) => ({
        miner: provider.miner,
        peerId: provider.peer_id,
        head: provider.head,
      }));

      if (!snapshot.length) {
        ads.value = [];
        failures.value = [];
        lastUpdated.value = Date.now();
        loading.value = false;
        return;
      }

      const settled = await Promise.allSettled(
        snapshot.map(async (provider) => {
          if (!provider.head) {
            return null;
          }

          const detail = await call<IpniAdDetail>("GetAd", [provider.head]);

          if (!detail) {
            throw new Error("Advertisement not found");
          }

          const row: IpniAdRow = {
            ...detail,
            peerId: provider.peerId,
            providerHead: provider.head,
          };

          return row;
        }),
      );

      if (requestId !== currentReq) {
        return;
      }

      const nextAds: IpniAdRow[] = [];
      const nextFailures: IpniAdFailure[] = [];

      settled.forEach((result, index) => {
        const provider = snapshot[index];
        if (result.status === "fulfilled" && result.value) {
          nextAds.push(result.value);
        } else if (result.status === "rejected") {
          nextFailures.push({
            miner: provider.miner,
            peerId: provider.peerId,
            head: provider.head,
            error:
              result.reason instanceof Error
                ? result.reason.message
                : String(result.reason),
          });
        }
      });

      ads.value = nextAds;
      failures.value = nextFailures;
      lastUpdated.value = Date.now();
    } catch (err) {
      if (requestId !== currentReq) {
        return;
      }
      error.value = err as Error;
    } finally {
      if (requestId === currentReq) {
        loading.value = false;
      }
    }
  };

  watch(
    providers,
    () => {
      if (summaryLoading.value || skipWatchFetch) {
        skipWatchFetch = false;
        return;
      }
      fetchAds();
    },
    { immediate: true },
  );

  const refresh = async () => {
    skipWatchFetch = true;
    loading.value = true;
    await refreshSummary();
    await fetchAds();
  };

  const stats = computed(() => {
    const data = ads.value;
    const total = data.length;
    const skipped = data.filter((item) => item.is_skip).length;
    const removals = data.filter((item) => item.is_rm).length;
    const totalEntries = data.reduce(
      (acc, item) => acc + (item.entry_count || 0),
      0,
    );

    return {
      total,
      skipped,
      removals,
      totalEntries,
    };
  });

  return {
    ads,
    failures,
    loading,
    error,
    lastUpdated,
    refresh,
    stats,
  };
};
