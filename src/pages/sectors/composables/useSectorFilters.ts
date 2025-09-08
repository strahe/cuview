import { ref, computed } from "vue";
import type { Ref } from "vue";
import type { SectorItem, SectorFilters } from "@/types/sector";

export function useSectorFilters(sectors: Ref<SectorItem[]>) {
  const filters = ref<SectorFilters>({});

  const filteredSectors = computed(() => {
    if (!sectors.value) return [];

    return sectors.value.filter((sector) => {
      // Search filter
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase();
        const searchable = [
          sector.MinerAddress,
          sector.SectorNum.toString(),
          sector.DealWeight,
          sector.Deals,
          sector.SealInfo,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(search)) return false;
      }

      // Specific filters
      if (
        filters.value.minerAddress &&
        sector.MinerAddress !== filters.value.minerAddress
      ) {
        return false;
      }

      if (
        filters.value.isOnChain !== undefined &&
        sector.IsOnChain !== filters.value.isOnChain
      ) {
        return false;
      }

      if (
        filters.value.isFilPlus !== undefined &&
        sector.IsFilPlus !== filters.value.isFilPlus
      ) {
        return false;
      }

      if (
        filters.value.proving !== undefined &&
        sector.Proving !== filters.value.proving
      ) {
        return false;
      }

      if (
        filters.value.hasSealed !== undefined &&
        sector.HasSealed !== filters.value.hasSealed
      ) {
        return false;
      }

      if (
        filters.value.hasUnsealed !== undefined &&
        sector.HasUnsealed !== filters.value.hasUnsealed
      ) {
        return false;
      }

      if (
        filters.value.hasSnap !== undefined &&
        sector.HasSnap !== filters.value.hasSnap
      ) {
        return false;
      }

      if (
        filters.value.sealInfo &&
        sector.SealInfo !== filters.value.sealInfo
      ) {
        return false;
      }

      return true;
    });
  });

  // Get unique values for dropdown filters
  const uniqueMinerAddresses = computed(() =>
    [...new Set(sectors.value?.map((s) => s.MinerAddress) || [])].sort(),
  );

  const uniqueSealInfo = computed(() =>
    [
      ...new Set(sectors.value?.map((s) => s.SealInfo).filter(Boolean) || []),
    ].sort(),
  );

  const clearFilters = () => {
    filters.value = {};
  };

  const updateFilter = (key: keyof SectorFilters, value: unknown) => {
    if (value === "" || value === null || value === undefined) {
      delete filters.value[key];
    } else {
      filters.value[key] = value;
    }
  };

  return {
    filters,
    filteredSectors,
    uniqueMinerAddresses,
    uniqueSealInfo,
    clearFilters,
    updateFilter,
  };
}
