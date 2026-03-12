export type StoragePathCapabilityFilter =
  | "all"
  | "seal"
  | "store"
  | "both"
  | "readonly";

export type StoragePathHealthFilter = "all" | "healthy" | "degraded";

export interface StoragePathsSearchState {
  q: string;
  capability: StoragePathCapabilityFilter;
  health: StoragePathHealthFilter;
}

export type StoragePathsSearchPatch = Partial<StoragePathsSearchState>;

export interface StorageGcSearchState {
  miner: string;
  sectorNum: number | null;
  limit: number;
  offset: number;
}

export type StorageGcSearchPatch = Partial<StorageGcSearchState>;

export interface StoragePathDetailSearchState extends StoragePathsSearchState {
  limit: number;
  offset: number;
}

export type StoragePathDetailSearchPatch =
  Partial<StoragePathDetailSearchState>;

export interface StoragePathInventorySummary {
  totalPathCount: number;
  healthyPaths: number;
  degradedPaths: number;
  storeCapablePaths: number;
  sealCapablePaths: number;
  readOnlyPaths: number;
}

export interface StorageOverviewSummary extends StoragePathInventorySummary {
  totalCapacity: number;
  totalAvailable: number;
  totalUsed: number;
  usedPercent: number;
}

export interface StorageGcSummary {
  totalMarks: number;
  actorCount: number;
  currentPageCount: number;
}

export interface StorageStoreTypeEmptyState {
  title: string;
  hint: string;
  storeCapablePaths: number;
  policyBucketCount: number;
  totalCapacity: number;
  totalAvailable: number;
}
