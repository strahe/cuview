import { computed } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import type { IpniProviderSummary, IpniSyncStatus } from "@/types/ipni";
import { hasSyncError, isSyncBehind } from "@/utils/ipni";

const METHOD = "IPNISummary";

export const useIpniSummary = () => {
  const { data, loading, error, refresh, lastUpdated } = useCachedQuery<
    IpniProviderSummary[]
  >(METHOD, [], {
    pollingInterval: 60000,
  });

  const providers = computed(() => data.value ?? []);

  const providerCount = computed(() => providers.value.length);

  const providersBehindCount = computed(
    () =>
      providers.value.filter((provider) =>
        (provider.sync_status || []).some((status) => isSyncBehind(status)),
      ).length,
  );

  const providersWithErrorsCount = computed(
    () =>
      providers.value.filter((provider) =>
        (provider.sync_status || []).some((status) => hasSyncError(status)),
      ).length,
  );

  const allStatuses = computed((): IpniSyncStatus[] =>
    providers.value.flatMap((provider) => provider.sync_status || []),
  );

  const totalServiceCount = computed(() => allStatuses.value.length);

  const serviceErrorCount = computed(
    () => allStatuses.value.filter((status) => hasSyncError(status)).length,
  );

  const serviceBehindCount = computed(
    () => allStatuses.value.filter((status) => isSyncBehind(status)).length,
  );

  return {
    data,
    providers,
    loading,
    error,
    refresh,
    lastUpdated,
    providerCount,
    providersBehindCount,
    providersWithErrorsCount,
    totalServiceCount,
    serviceErrorCount,
    serviceBehindCount,
  };
};
