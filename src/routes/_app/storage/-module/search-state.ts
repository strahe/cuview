import type {
  StorageGcSearchPatch,
  StorageGcSearchState,
  StoragePathCapabilityFilter,
  StoragePathDetailSearchPatch,
  StoragePathDetailSearchState,
  StoragePathHealthFilter,
  StoragePathsSearchPatch,
  StoragePathsSearchState,
} from "./types";

export const DEFAULT_STORAGE_PATHS_SEARCH: StoragePathsSearchState = {
  q: "",
  capability: "all",
  health: "all",
};

export const DEFAULT_STORAGE_GC_SEARCH: StorageGcSearchState = {
  miner: "",
  sectorNum: null,
  limit: 50,
  offset: 0,
};

export const DEFAULT_STORAGE_PATH_DETAIL_SEARCH: StoragePathDetailSearchState =
  {
    ...DEFAULT_STORAGE_PATHS_SEARCH,
    limit: 50,
    offset: 0,
  };

const parsePositiveInt = (
  value: unknown,
  fallback: number,
  options?: { min?: number; max?: number },
): number => {
  const min = options?.min ?? 0;
  const max = options?.max ?? Number.POSITIVE_INFINITY;

  let parsed: number | null = null;
  if (typeof value === "number" && Number.isFinite(value)) {
    parsed = Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const stringParsed = Number.parseInt(value, 10);
    if (Number.isFinite(stringParsed)) parsed = stringParsed;
  }

  if (parsed === null || parsed < min) return fallback;
  return Math.min(parsed, max);
};

const parseStoragePathCapability = (
  value: unknown,
): StoragePathCapabilityFilter => {
  if (
    value === "all" ||
    value === "seal" ||
    value === "store" ||
    value === "both" ||
    value === "readonly"
  ) {
    return value;
  }

  return "all";
};

const parseStoragePathHealth = (value: unknown): StoragePathHealthFilter => {
  if (value === "all" || value === "healthy" || value === "degraded") {
    return value;
  }

  return "all";
};

export const normalizeStoragePathsSearch = (
  search: Record<string, unknown>,
) => {
  const q =
    typeof search.q === "string" ? search.q : DEFAULT_STORAGE_PATHS_SEARCH.q;

  return {
    q: q.trim(),
    capability: parseStoragePathCapability(search.capability),
    health: parseStoragePathHealth(search.health),
  } satisfies StoragePathsSearchState;
};

export const patchStoragePathsSearch = (
  prev: StoragePathsSearchState,
  patch: StoragePathsSearchPatch,
): StoragePathsSearchState => {
  return normalizeStoragePathsSearch({ ...prev, ...patch });
};

export const normalizeStorageGcSearch = (search: Record<string, unknown>) => {
  const miner =
    typeof search.miner === "string"
      ? search.miner
      : DEFAULT_STORAGE_GC_SEARCH.miner;
  const sectorNum = parsePositiveInt(search.sectorNum, 0, { min: 0 });

  return {
    miner: miner.trim(),
    sectorNum: sectorNum > 0 ? sectorNum : null,
    limit: parsePositiveInt(search.limit, DEFAULT_STORAGE_GC_SEARCH.limit, {
      min: 1,
      max: 200,
    }),
    offset: parsePositiveInt(search.offset, DEFAULT_STORAGE_GC_SEARCH.offset, {
      min: 0,
    }),
  } satisfies StorageGcSearchState;
};

export const patchStorageGcSearch = (
  prev: StorageGcSearchState,
  patch: StorageGcSearchPatch,
): StorageGcSearchState => {
  const merged = normalizeStorageGcSearch({ ...prev, ...patch });
  const resetOffset =
    patch.miner !== undefined ||
    patch.sectorNum !== undefined ||
    patch.limit !== undefined;

  if (patch.offset !== undefined) {
    merged.offset = parsePositiveInt(patch.offset, prev.offset, { min: 0 });
  } else if (resetOffset) {
    merged.offset = 0;
  } else {
    merged.offset = prev.offset;
  }

  return merged;
};

export const normalizeStoragePathDetailSearch = (
  search: Record<string, unknown>,
) => {
  const pathSearch = normalizeStoragePathsSearch(search);

  return {
    ...pathSearch,
    limit: parsePositiveInt(
      search.limit,
      DEFAULT_STORAGE_PATH_DETAIL_SEARCH.limit,
      {
        min: 1,
        max: 200,
      },
    ),
    offset: parsePositiveInt(
      search.offset,
      DEFAULT_STORAGE_PATH_DETAIL_SEARCH.offset,
      {
        min: 0,
      },
    ),
  } satisfies StoragePathDetailSearchState;
};

export const patchStoragePathDetailSearch = (
  prev: StoragePathDetailSearchState,
  patch: StoragePathDetailSearchPatch,
): StoragePathDetailSearchState => {
  const merged = normalizeStoragePathDetailSearch({ ...prev, ...patch });
  const resetOffset =
    patch.q !== undefined ||
    patch.capability !== undefined ||
    patch.health !== undefined ||
    patch.limit !== undefined;

  if (patch.offset !== undefined) {
    merged.offset = parsePositiveInt(patch.offset, prev.offset, { min: 0 });
  } else if (resetOffset) {
    merged.offset = 0;
  } else {
    merged.offset = prev.offset;
  }

  return merged;
};
