export const storageQueryKeys = {
  usage: ["curio", "StorageUseStats"] as const,
  storeTypeStats: ["curio", "StorageStoreTypeStats"] as const,
  pathsSummary: ["curio", "StoragePathsSummary"] as const,
  paths: ["curio", "StoragePathList"] as const,
  pathDetail: (storageId: string) =>
    ["curio", "StoragePathDetail", storageId] as const,
  pathSectors: (storageId: string, limit: number, offset: number) =>
    ["curio", "StoragePathSectors", storageId, limit, offset] as const,
  hostToMachineId: (hostsKey: string) =>
    ["curio", "HostToMachineID", hostsKey] as const,
  gcStats: ["curio", "StorageGCStats"] as const,
  gcMarks: (
    miner: string | null,
    sectorNum: number | null,
    limit: number,
    offset: number,
  ) => ["curio", "StorageGCMarks", miner, sectorNum, limit, offset] as const,
};

export const storageGcInvalidateKeys = [
  ["curio", "StorageGCStats"],
  ["curio", "StorageGCMarks"],
  ["curio", "StoragePathDetail"],
];
