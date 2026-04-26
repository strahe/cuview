import type {
  StorageGCStatsEntry,
  StoragePathInfo,
  StorageUseStat,
} from "@/types/storage";
import type {
  StorageGcSummary,
  StorageOverviewSummary,
  StoragePathCapabilityFilter,
  StoragePathHealthFilter,
  StoragePathInventorySummary,
  StoragePathsSearchState,
  StorageStoreTypeEmptyState,
} from "./types";

const toSearchableText = (path: StoragePathInfo): string => {
  return [
    path.StorageID,
    path.PathType,
    path.HealthStatus,
    path.HostList?.join(" "),
    path.GroupList?.join(" "),
    path.AllowToList?.join(" "),
    path.AllowTypesList?.join(" "),
    path.DenyTypesList?.join(" "),
    path.AllowMinersList?.join(" "),
    path.DenyMinersList?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

export const matchesStorageCapability = (
  path: StoragePathInfo,
  capability: StoragePathCapabilityFilter,
): boolean => {
  const canSeal = Boolean(path.CanSeal);
  const canStore = Boolean(path.CanStore);

  switch (capability) {
    case "seal":
      return canSeal && !canStore;
    case "store":
      return !canSeal && canStore;
    case "both":
      return canSeal && canStore;
    case "readonly":
      return !canSeal && !canStore;
    default:
      return true;
  }
};

export const matchesStorageHealth = (
  path: StoragePathInfo,
  health: StoragePathHealthFilter,
): boolean => {
  if (health === "all") return true;
  if (health === "healthy") return Boolean(path.HealthOK);
  return !path.HealthOK;
};

export const filterStoragePaths = (
  paths: StoragePathInfo[],
  search: StoragePathsSearchState,
) => {
  const query = search.q.trim().toLowerCase();

  return paths.filter((path) => {
    if (!matchesStorageCapability(path, search.capability)) return false;
    if (!matchesStorageHealth(path, search.health)) return false;
    if (!query) return true;

    return toSearchableText(path).includes(query);
  });
};

export const summarizeStoragePathInventory = (
  paths: StoragePathInfo[],
): StoragePathInventorySummary => {
  let healthyPaths = 0;
  let storeCapablePaths = 0;
  let sealCapablePaths = 0;
  let readOnlyPaths = 0;

  // Optimization: Single-pass iteration to prevent O(4N) array traversals
  for (const path of paths) {
    if (path.HealthOK) healthyPaths++;
    if (path.CanStore) storeCapablePaths++;
    if (path.CanSeal) sealCapablePaths++;
    if (!path.CanSeal && !path.CanStore) readOnlyPaths++;
  }

  const degradedPaths = paths.length - healthyPaths;

  return {
    totalPathCount: paths.length,
    healthyPaths,
    degradedPaths,
    storeCapablePaths,
    sealCapablePaths,
    readOnlyPaths,
  };
};

export const summarizeStorageOverview = (
  useStats: StorageUseStat[],
  paths: StoragePathInfo[],
): StorageOverviewSummary => {
  const inventory = summarizeStoragePathInventory(paths);
  const totalCapacity = useStats.reduce((sum, stat) => sum + stat.Capacity, 0);
  const totalAvailable = useStats.reduce(
    (sum, stat) => sum + stat.Available,
    0,
  );
  const totalUsed = Math.max(totalCapacity - totalAvailable, 0);
  const usedPercent = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

  return {
    ...inventory,
    totalCapacity,
    totalAvailable,
    totalUsed,
    usedPercent,
  };
};

export const summarizeStorageGc = (
  stats: StorageGCStatsEntry[],
  currentPageCount: number,
): StorageGcSummary => {
  return {
    totalMarks: stats.reduce((sum, row) => sum + row.Count, 0),
    actorCount: stats.length,
    currentPageCount,
  };
};

export const formatStoragePageInfo = (
  total: number,
  offset: number,
  rowCount: number,
  emptyLabel = "Rows 0",
) => {
  if (total <= 0) {
    return emptyLabel;
  }

  if (rowCount <= 0) {
    return `Rows 0 of ${total}`;
  }

  return `Rows ${offset + 1}-${offset + rowCount} of ${total}`;
};

const getStorePolicySignature = (path: StoragePathInfo) => {
  const allowTypes = [...(path.AllowTypesList ?? [])].sort().join(",");
  const denyTypes = [...(path.DenyTypesList ?? [])].sort().join(",");

  return `${allowTypes || "*"}|${denyTypes || "-"}`;
};

export const getStorageStoreTypeEmptyState = (
  paths: StoragePathInfo[],
): StorageStoreTypeEmptyState => {
  let storeCapablePaths = 0;
  let totalCapacity = 0;
  let totalAvailable = 0;
  const policyBuckets = new Set<string>();

  for (const path of paths) {
    if (!path.CanStore) {
      continue;
    }

    storeCapablePaths++;
    policyBuckets.add(getStorePolicySignature(path));
    totalCapacity += path.Capacity ?? 0;
    totalAvailable += path.Available ?? 0;
  }

  const policyBucketCount = policyBuckets.size;

  if (storeCapablePaths > 0) {
    return {
      title: "No breakdown",
      hint: "All store paths currently collapse into one policy bucket.",
      storeCapablePaths,
      policyBucketCount,
      totalCapacity,
      totalAvailable,
    };
  }

  return {
    title: "No store paths",
    hint: "This endpoint is not advertising any store-capable path.",
    storeCapablePaths: 0,
    policyBucketCount: 0,
    totalCapacity,
    totalAvailable,
  };
};

const getStorageRiskScore = (path: StoragePathInfo): number => {
  const unhealthyWeight = path.HealthOK ? 0 : 1_000;
  const usageWeight = path.UsedPercent ?? 0;
  const reservedWeight = (path.ReservedPercent ?? 0) / 2;

  return unhealthyWeight + usageWeight + reservedWeight;
};

export const getStorageHighlightPaths = (
  paths: StoragePathInfo[],
  limit = 5,
) => {
  return [...paths]
    .sort((left, right) => {
      const scoreDiff = getStorageRiskScore(right) - getStorageRiskScore(left);
      if (scoreDiff !== 0) return scoreDiff;

      return (right.Capacity ?? 0) - (left.Capacity ?? 0);
    })
    .slice(0, limit);
};
