import { describe, expect, it } from "vitest";
import type {
  StorageGCStatsEntry,
  StoragePathInfo,
  StorageUseStat,
} from "@/types/storage";
import {
  filterStoragePaths,
  formatStoragePageInfo,
  getStorageHighlightPaths,
  getStorageStoreTypeEmptyState,
  summarizeStorageGc,
  summarizeStorageOverview,
  summarizeStoragePathInventory,
} from "./filters";

const samplePaths: StoragePathInfo[] = [
  {
    StorageID: "alpha-seal",
    PathType: "Seal",
    CapacityStr: "100 GiB",
    AvailableStr: "20 GiB",
    UsedStr: "80 GiB",
    UsedPercent: 80,
    ReservedStr: "5 GiB",
    ReservedPercent: 5,
    HealthStatus: "healthy",
    HealthOK: true,
    CanSeal: true,
    CanStore: false,
    Capacity: 100,
    Available: 20,
    HostList: ["worker-01"],
    GroupList: ["hot"],
  },
  {
    StorageID: "beta-store",
    PathType: "Store",
    CapacityStr: "200 GiB",
    AvailableStr: "10 GiB",
    UsedStr: "190 GiB",
    UsedPercent: 95,
    ReservedStr: "12 GiB",
    ReservedPercent: 12,
    HealthStatus: "heartbeat stale",
    HealthOK: false,
    CanSeal: false,
    CanStore: true,
    Capacity: 200,
    Available: 10,
    HostList: ["worker-02"],
    GroupList: ["cold"],
  },
  {
    StorageID: "gamma-ro",
    PathType: "ReadOnly",
    CapacityStr: "50 GiB",
    AvailableStr: "50 GiB",
    UsedStr: "0 GiB",
    UsedPercent: 0,
    HealthStatus: "healthy",
    HealthOK: true,
    CanSeal: false,
    CanStore: false,
    Capacity: 50,
    Available: 50,
    HostList: ["archive-01"],
  },
];

const sampleUseStats: StorageUseStat[] = [
  {
    CanSeal: true,
    CanStore: false,
    Type: "Seal",
    Capacity: 100,
    Available: 20,
  },
  {
    CanSeal: false,
    CanStore: true,
    Type: "Store",
    Capacity: 200,
    Available: 10,
  },
];

const sampleGcStats: StorageGCStatsEntry[] = [
  { Actor: 1001, Miner: "f01001", Count: 2 },
  { Actor: 1002, Miner: "f01002", Count: 5 },
];

describe("storage filters", () => {
  it("filters paths by query, capability and health", () => {
    const rows = filterStoragePaths(samplePaths, {
      q: "worker-02",
      capability: "store",
      health: "degraded",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.StorageID).toBe("beta-store");
  });

  it("summarizes path inventory and overall capacity", () => {
    expect(summarizeStoragePathInventory(samplePaths)).toEqual({
      totalPathCount: 3,
      healthyPaths: 2,
      degradedPaths: 1,
      storeCapablePaths: 1,
      sealCapablePaths: 1,
      readOnlyPaths: 1,
    });

    expect(summarizeStorageOverview(sampleUseStats, samplePaths)).toMatchObject(
      {
        totalPathCount: 3,
        totalCapacity: 300,
        totalAvailable: 30,
        totalUsed: 270,
        degradedPaths: 1,
      },
    );
  });

  it("prioritizes unhealthy and saturated paths in highlights", () => {
    const rows = getStorageHighlightPaths(samplePaths, 2);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.StorageID).toBe("beta-store");
    expect(rows[1]?.StorageID).toBe("alpha-seal");
  });

  it("summarizes gc totals", () => {
    expect(summarizeStorageGc(sampleGcStats, 3)).toEqual({
      totalMarks: 7,
      actorCount: 2,
      currentPageCount: 3,
    });
  });

  it("describes the store type empty state clearly", () => {
    expect(getStorageStoreTypeEmptyState([])).toEqual({
      title: "No store paths",
      hint: "This endpoint is not advertising any store-capable path.",
      storeCapablePaths: 0,
      policyBucketCount: 0,
      totalCapacity: 0,
      totalAvailable: 0,
    });

    expect(getStorageStoreTypeEmptyState(samplePaths)).toEqual({
      title: "No breakdown",
      hint: "All store paths currently collapse into one policy bucket.",
      storeCapablePaths: 1,
      policyBucketCount: 1,
      totalCapacity: 200,
      totalAvailable: 10,
    });
  });

  it("aggregates only store-capable paths for the store type empty state", () => {
    expect(
      getStorageStoreTypeEmptyState([
        ...samplePaths,
        {
          ...samplePaths[1]!,
          AllowTypesList: ["Piece"],
          Available: 25,
          Capacity: 300,
          GroupList: ["warm"],
          StorageID: "delta-store",
        },
      ]),
    ).toEqual({
      title: "No breakdown",
      hint: "All store paths currently collapse into one policy bucket.",
      storeCapablePaths: 2,
      policyBucketCount: 2,
      totalCapacity: 500,
      totalAvailable: 35,
    });
  });

  it("formats storage page info without impossible row ranges", () => {
    expect(formatStoragePageInfo(0, 0, 0)).toBe("Rows 0");
    expect(formatStoragePageInfo(100, 100, 0)).toBe("Rows 0 of 100");
    expect(formatStoragePageInfo(100, 20, 20)).toBe("Rows 21-40 of 100");
    expect(formatStoragePageInfo(0, 0, 0, "0 entries")).toBe("0 entries");
  });
});
