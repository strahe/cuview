import { ref, computed } from "vue";
import { useLazyQuery } from "@/composables/useLazyQuery";
import type { IpniEntryInfo } from "@/types/ipni";

export const useIpniEntryLookup = () => {
  const {
    data,
    loading,
    error,
    execute,
    reset: resetQuery,
  } = useLazyQuery<IpniEntryInfo>("IPNIEntry");
  const lastQuery = ref<string>("");

  const entry = computed(() =>
    data.value ? normalizeEntry(data.value) : null,
  );

  const search = async (rawCid: string) => {
    const cid = rawCid.trim();
    if (!cid) {
      resetQuery();
      lastQuery.value = "";
      return;
    }

    try {
      await execute({ "/": cid });
      lastQuery.value = cid;
    } catch {
      // error ref already updated by useLazyQuery
    }
  };

  const loadPrevious = async () => {
    const previousCid = entry.value?.PrevCID;
    if (!previousCid) return;

    if (typeof previousCid === "string" && previousCid.length > 0) {
      await search(previousCid);
      return;
    }

    if (
      typeof previousCid === "object" &&
      previousCid !== null &&
      "/" in previousCid
    ) {
      const value = String((previousCid as Record<string, unknown>)["/"] || "");
      if (value) {
        await search(value);
      }
    }
  };

  const reset = () => {
    resetQuery();
    lastQuery.value = "";
  };

  return {
    entry,
    loading,
    error,
    lastQuery,
    search,
    loadPrevious,
    reset,
  };
};

const normalizeEntry = (entry: IpniEntryInfo): IpniEntryInfo => {
  const normalized = { ...entry };

  if (
    normalized.FirstCID &&
    typeof normalized.FirstCID === "object" &&
    normalized.FirstCID !== null &&
    "/" in normalized.FirstCID
  ) {
    normalized.FirstCID = String(normalized.FirstCID["/"] || "");
  }

  if (
    normalized.PrevCID &&
    typeof normalized.PrevCID === "object" &&
    normalized.PrevCID !== null &&
    "/" in normalized.PrevCID
  ) {
    normalized.PrevCID = String(normalized.PrevCID["/"] || "");
  }

  return normalized;
};
