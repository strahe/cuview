import { computed, ref } from "vue";
import { useCurioQuery } from "@/composables/useCurioQuery";
import { useLazyQuery } from "@/composables/useLazyQuery";
import type { IpniAdDetail } from "@/types/ipni";

export const useIpniAdSearch = () => {
  const {
    execute,
    data,
    loading,
    error,
    reset: resetQuery,
  } = useLazyQuery<IpniAdDetail>("GetAd");
  const { call } = useCurioQuery();

  const lastQuery = ref<string>("");

  const skipMutationPending = ref(false);
  const skipMutationError = ref<Error | null>(null);

  const ad = computed(() => data.value);
  const hasResult = computed(() => ad.value !== null);

  const search = async (rawCid: string) => {
    const cid = rawCid.trim();
    if (!cid) {
      resetQuery();
      lastQuery.value = "";
      return;
    }

    try {
      await execute(cid);
      lastQuery.value = cid;
    } catch {
      // error ref already updated by useLazyQuery
    }
  };

  const toggleSkip = async (skip: boolean) => {
    const current = ad.value;
    if (!current) return;

    skipMutationPending.value = true;
    skipMutationError.value = null;

    try {
      await call<void>("IPNISetSkip", [{ "/": current.ad_cid }, skip]);
      await search(current.ad_cid);
    } catch (err) {
      skipMutationError.value = err as Error;
    } finally {
      skipMutationPending.value = false;
    }
  };

  const reset = () => {
    resetQuery();
    lastQuery.value = "";
    skipMutationError.value = null;
    skipMutationPending.value = false;
  };

  return {
    ad,
    loading,
    error,
    hasResult,
    lastQuery,
    skipMutationPending,
    skipMutationError,
    search,
    toggleSkip,
    reset,
  };
};
