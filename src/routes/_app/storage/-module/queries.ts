import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useCurioApi, useCurioConnection } from "@/contexts/curio-api-context";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import type {
  StorageGCMark,
  StorageGCMarksResponse,
  StorageGCStatsEntry,
  StoragePathDetailGCMark,
  StoragePathDetailResult,
  StoragePathInfo,
  StoragePathMinerSummary,
  StoragePathSectorsResult,
  StoragePathTypeSummary,
  StoragePathURLLiveness,
  StorageStoreStats,
  StorageUseStat,
} from "@/types/storage";
import { storageGcInvalidateKeys, storageQueryKeys } from "./query-keys";

type StorageGCMarksResponsePayload = {
  Marks?: StorageGCMark[] | null;
  Total?: number | null;
} | null;

type StoragePathDetailResponsePayload =
  | (Omit<
      StoragePathDetailResult,
      "Info" | "URLs" | "GCMarks" | "ByType" | "ByMiner"
    > & {
      Info?: StoragePathDetailResult["Info"] | null;
      URLs?: StoragePathURLLiveness[] | null;
      GCMarks?: StoragePathDetailGCMark[] | null;
      ByType?: StoragePathTypeSummary[] | null;
      ByMiner?: StoragePathMinerSummary[] | null;
    })
  | null;

type StoragePathSectorsResponsePayload = {
  Sectors?: StoragePathSectorsResult["Sectors"] | null;
  Total?: number | null;
} | null;

type StorageBaseQueryKey = readonly ["curio", string, ...unknown[]];

export function withStorageEndpointQueryKey(
  queryKey: StorageBaseQueryKey,
  endpoint: string,
) {
  const [, method, ...params] = queryKey;

  return ["curio", method, endpoint, ...params] as const;
}

export function normalizeStorageHost(host: string) {
  return host.trim();
}

export function getMachineIdForHost(
  machineMap: Record<string, number>,
  host: string,
) {
  const normalizedHost = normalizeStorageHost(host);
  return normalizedHost ? machineMap[normalizedHost] : undefined;
}

export function normalizeStorageGcMarksResponse(
  response: StorageGCMarksResponsePayload,
): StorageGCMarksResponse {
  return {
    Marks: response?.Marks ?? [],
    Total: response?.Total ?? 0,
  };
}

export function normalizeStoragePathDetailResponse(
  response: StoragePathDetailResponsePayload,
): StoragePathDetailResult | null {
  if (!response?.Info) {
    return null;
  }

  return {
    ...response,
    Info: response.Info,
    URLs: response.URLs ?? [],
    GCMarks: response.GCMarks ?? [],
    ByType: response.ByType ?? [],
    ByMiner: response.ByMiner ?? [],
  };
}

export function normalizeStoragePathSectorsResponse(
  response: StoragePathSectorsResponsePayload,
): StoragePathSectorsResult {
  return {
    Sectors: response?.Sectors ?? [],
    Total: response?.Total ?? 0,
  };
}

export function useStorageUsage() {
  return useCurioRpc<StorageUseStat[]>("StorageUseStats", [], {
    refetchInterval: 60_000,
  });
}

export function useStorageStoreTypeStats() {
  return useCurioRpc<StorageStoreStats[]>("StorageStoreTypeStats", [], {
    refetchInterval: 120_000,
  });
}

export function useStoragePathsSummary() {
  return useCurioRpc<StoragePathInfo[]>("StoragePathsSummary", [], {
    refetchInterval: 60_000,
  });
}

export function useStoragePaths() {
  return useCurioRpc<StoragePathInfo[]>("StoragePathList", [], {
    refetchInterval: 60_000,
  });
}

export function useStoragePathDetail(storageId: string) {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  return useQuery({
    queryKey: withStorageEndpointQueryKey(
      storageQueryKeys.pathDetail(storageId),
      endpoint,
    ),
    queryFn: async () =>
      normalizeStoragePathDetailResponse(
        await api.call<StoragePathDetailResponsePayload>("StoragePathDetail", [
          storageId,
        ]),
      ),
    enabled: storageId.trim().length > 0,
    refetchInterval: 30_000,
  });
}

export function useStoragePathSectors(
  storageId: string,
  limit: number,
  offset: number,
) {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  return useQuery({
    queryKey: withStorageEndpointQueryKey(
      storageQueryKeys.pathSectors(storageId, limit, offset),
      endpoint,
    ),
    queryFn: async () =>
      normalizeStoragePathSectorsResponse(
        await api.call<StoragePathSectorsResponsePayload>(
          "StoragePathSectors",
          [storageId, limit, offset],
        ),
      ),
    enabled: storageId.trim().length > 0,
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useHostToMachineId(hosts: string[]) {
  const normalizedHosts = useMemo(
    () =>
      [
        ...new Set(
          hosts
            .map((host) => normalizeStorageHost(host))
            .filter((host) => host),
        ),
      ].sort((left, right) => left.localeCompare(right)),
    [hosts],
  );

  const hostsKey = normalizedHosts.join("|");

  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  return useQuery({
    queryKey: withStorageEndpointQueryKey(
      storageQueryKeys.hostToMachineId(hostsKey),
      endpoint,
    ),
    queryFn: () =>
      api.call<Record<string, number>>("HostToMachineID", [normalizedHosts]),
    enabled: normalizedHosts.length > 0,
    refetchInterval: 120_000,
    staleTime: 60_000,
  });
}

export function useStorageGcStats() {
  return useCurioRpc<StorageGCStatsEntry[]>("StorageGCStats", [], {
    refetchInterval: 60_000,
  });
}

export function useStorageGcMarks(
  miner: string | null,
  sectorNum: number | null,
  limit: number,
  offset: number,
) {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  return useQuery({
    queryKey: withStorageEndpointQueryKey(
      storageQueryKeys.gcMarks(miner, sectorNum, limit, offset),
      endpoint,
    ),
    queryFn: async () =>
      normalizeStorageGcMarksResponse(
        await api.call<StorageGCMarksResponsePayload>("StorageGCMarks", [
          miner,
          sectorNum,
          limit,
          offset,
        ]),
      ),
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useStorageGcApprove() {
  return useCurioRpcMutation("StorageGCApprove", {
    invalidateKeys: storageGcInvalidateKeys,
  });
}

export function useStorageGcUnapprove() {
  return useCurioRpcMutation("StorageGCUnapprove", {
    invalidateKeys: storageGcInvalidateKeys,
  });
}

export function useStorageGcApproveAll() {
  return useCurioRpcMutation("StorageGCApproveAll", {
    invalidateKeys: storageGcInvalidateKeys,
  });
}

export function useStorageGcUnapproveAll() {
  return useCurioRpcMutation("StorageGCUnapproveAll", {
    invalidateKeys: storageGcInvalidateKeys,
  });
}

export function useRecentGcMarks(
  detail: StoragePathDetailResult | null | undefined,
): StorageGCMark[] {
  return useMemo(
    () =>
      (detail?.GCMarks ?? []).map((mark) => ({
        Actor: mark.MinerID,
        SectorNum: mark.SectorNum,
        FileType: mark.FileType,
        StorageID: detail?.Info?.StorageID ?? "",
        CreatedAt: mark.CreatedAt,
        Approved: mark.Approved,
        CanSeal: Boolean(detail?.Info?.CanSeal),
        CanStore: Boolean(detail?.Info?.CanStore),
        Urls: detail?.Info?.HostList?.join(", ") ?? "",
        TypeName: mark.FileTypeStr,
        PathType: detail?.Info?.PathType ?? "",
        Miner: mark.Miner,
      })),
    [detail],
  );
}
