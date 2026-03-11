import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import type {
  AllowDenyEntry,
  ClientFilter,
  DefaultFilterBehaviour,
  MK12Pipeline,
  Mk20Pipeline,
  Mk20PipelineFailedStats,
  OpenDealInfo,
  PieceSummary,
  PipelineFailedStats,
  PricingFilter,
  StorageAsk,
} from "@/types/market";
import {
  asksInvalidateKeys,
  balanceInvalidateKeys,
  filtersInvalidateKeys,
  mk12InvalidateKeys,
  mk20InvalidateKeys,
  pendingInvalidateKeys,
  productsInvalidateKeys,
} from "./query-keys";
import type {
  ContentEntry,
  MarketBalanceEntry,
  MK12DealListItem,
  MK20DealDetailResponse,
  MK20DealListItem,
  PieceDealDetailItem,
  PieceInfoResult,
  PieceParkState,
  StorageDealDetail,
  UploadStatusResult,
} from "./types";

// ---------------------------------------------------------------------------
// Balance
// ---------------------------------------------------------------------------

export function useMarketBalance() {
  return useCurioRpc<MarketBalanceEntry[]>("MarketBalance", [], {
    refetchInterval: 60_000,
  });
}

export function useMoveToEscrow() {
  return useCurioRpcMutation("MoveBalanceToEscrow", {
    invalidateKeys: balanceInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// Piece Summary
// ---------------------------------------------------------------------------

export function usePieceSummary() {
  return useCurioRpc<PieceSummary>("PieceSummary", [], {
    refetchInterval: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Asks
// ---------------------------------------------------------------------------

export function useStorageAsks() {
  return useCurioRpc<StorageAsk[]>("GetStorageAsk", [], {
    refetchInterval: 60_000,
  });
}

export function useSetStorageAsk() {
  return useCurioRpcMutation("SetStorageAsk", {
    invalidateKeys: asksInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// Pending Deals
// ---------------------------------------------------------------------------

export function usePendingDeals() {
  return useCurioRpc<OpenDealInfo[]>("DealsPending", [], {
    refetchInterval: 30_000,
  });
}

export function useSealNow() {
  return useCurioRpcMutation("DealsSealNow", {
    invalidateKeys: pendingInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// MK12 Deals
// ---------------------------------------------------------------------------

export function useMK12Pipelines() {
  return useCurioRpc<MK12Pipeline[]>("GetMK12DealPipelines", [], {
    refetchInterval: 30_000,
  });
}

export function useMK12Deals() {
  return useCurioRpc<MK12DealListItem[]>("MK12StorageDealList", [100, 0], {
    refetchInterval: 30_000,
  });
}

export function useMK12DDODeals() {
  return useCurioRpc<MK12DealListItem[]>("MK12DDOStorageDealList", [100, 0], {
    refetchInterval: 30_000,
  });
}

export function useMK12FailedTasks() {
  return useCurioRpc<PipelineFailedStats>("MK12PipelineFailedTasks", [], {
    refetchInterval: 60_000,
  });
}

export function useMK12BulkRestart() {
  return useCurioRpcMutation("MK12BulkRestartFailedMarketTasks", {
    invalidateKeys: mk12InvalidateKeys,
  });
}

export function useMK12BulkRemove() {
  return useCurioRpcMutation("MK12BulkRemoveFailedMarketPipelines", {
    invalidateKeys: mk12InvalidateKeys,
  });
}

export function useDealPipelineRemove() {
  return useCurioRpcMutation("DealPipelineRemove", {
    invalidateKeys: [...mk12InvalidateKeys, ...mk20InvalidateKeys],
  });
}

// MK12 single deal detail
export function useStorageDealInfo(dealId: string | undefined) {
  return useCurioRpc<StorageDealDetail>("StorageDealInfo", [dealId ?? ""], {
    enabled: !!dealId,
  });
}

// ---------------------------------------------------------------------------
// MK20 Deals
// ---------------------------------------------------------------------------

export function useMK20Pipelines() {
  return useCurioRpc<Mk20Pipeline[]>("MK20DDOPipelines", [100, 0], {
    refetchInterval: 30_000,
  });
}

export function useMK20Deals() {
  return useCurioRpc<MK20DealListItem[]>("MK20DDOStorageDeals", [100, 0], {
    refetchInterval: 30_000,
  });
}

export function useMK20FailedTasks() {
  return useCurioRpc<Mk20PipelineFailedStats>("MK20PipelineFailedTasks", [], {
    refetchInterval: 60_000,
  });
}

export function useMK20BulkRestart() {
  return useCurioRpcMutation("MK20BulkRestartFailedMarketTasks", {
    invalidateKeys: mk20InvalidateKeys,
  });
}

export function useMK20BulkRemove() {
  return useCurioRpcMutation("MK20BulkRemoveFailedMarketPipelines", {
    invalidateKeys: mk20InvalidateKeys,
  });
}

// MK20 single deal detail
export function useMK20DealDetail(dealId: string | undefined) {
  return useCurioRpc<MK20DealDetailResponse>(
    "MK20DDOStorageDeal",
    [dealId ?? ""],
    {
      enabled: !!dealId,
    },
  );
}

// ---------------------------------------------------------------------------
// Products, Data Sources, Contracts (MK20 page)
// ---------------------------------------------------------------------------

export function useProducts() {
  return useCurioRpc<Record<string, boolean>>("ListProducts", [], {
    refetchInterval: 60_000,
  });
}

export function useEnableProduct() {
  return useCurioRpcMutation("EnableProduct", {
    invalidateKeys: productsInvalidateKeys,
  });
}

export function useDisableProduct() {
  return useCurioRpcMutation("DisableProduct", {
    invalidateKeys: productsInvalidateKeys,
  });
}

export function useDataSources() {
  return useCurioRpc<Record<string, boolean>>("ListDataSources", [], {
    refetchInterval: 60_000,
  });
}

export function useEnableDataSource() {
  return useCurioRpcMutation("EnableDataSource", {
    invalidateKeys: productsInvalidateKeys,
  });
}

export function useDisableDataSource() {
  return useCurioRpcMutation("DisableDataSource", {
    invalidateKeys: productsInvalidateKeys,
  });
}

export function useContracts() {
  return useCurioRpc<Record<string, string>>("ListMarketContracts", [], {
    refetchInterval: 60_000,
  });
}

export function useAddContract() {
  return useCurioRpcMutation("AddMarketContract", {
    invalidateKeys: productsInvalidateKeys,
  });
}

export function useUpdateContract() {
  return useCurioRpcMutation("UpdateMarketContract", {
    invalidateKeys: productsInvalidateKeys,
  });
}

export function useRemoveContract() {
  return useCurioRpcMutation("RemoveMarketContract", {
    invalidateKeys: productsInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// Settings - Filters
// ---------------------------------------------------------------------------

export function usePricingFilters() {
  return useCurioRpc<PricingFilter[]>("GetPriceFilters", [], {
    refetchInterval: 60_000,
  });
}

export function useAddPricingFilter() {
  return useCurioRpcMutation("AddPriceFilters", {
    invalidateKeys: filtersInvalidateKeys,
  });
}

export function useRemovePricingFilter() {
  return useCurioRpcMutation("RemovePricingFilter", {
    invalidateKeys: filtersInvalidateKeys,
  });
}

export function useClientFilters() {
  return useCurioRpc<ClientFilter[]>("GetClientFilters", [], {
    refetchInterval: 60_000,
  });
}

export function useAddClientFilter() {
  return useCurioRpcMutation("AddClientFilters", {
    invalidateKeys: filtersInvalidateKeys,
  });
}

export function useRemoveClientFilter() {
  return useCurioRpcMutation("RemoveClientFilter", {
    invalidateKeys: filtersInvalidateKeys,
  });
}

export function useAllowDenyList() {
  return useCurioRpc<AllowDenyEntry[]>("GetAllowDenyList", [], {
    refetchInterval: 60_000,
  });
}

export function useAddAllowDeny() {
  return useCurioRpcMutation("AddAllowDenyList", {
    invalidateKeys: filtersInvalidateKeys,
  });
}

export function useRemoveAllow() {
  return useCurioRpcMutation("RemoveAllowFilter", {
    invalidateKeys: filtersInvalidateKeys,
  });
}

export function useDefaultFilterBehaviour() {
  return useCurioRpc<DefaultFilterBehaviour>("DefaultFilterBehaviour", [], {
    refetchInterval: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Piece Lookups (on-demand, no polling)
// ---------------------------------------------------------------------------

export function usePieceInfo(cid: string | null) {
  return useCurioRpc<PieceInfoResult>("PieceInfo", [cid ?? ""], {
    enabled: !!cid,
  });
}

export function usePieceDealDetail(cid: string | null, enabled: boolean) {
  return useCurioRpc<PieceDealDetailItem[]>("PieceDealDetail", [cid ?? ""], {
    enabled: !!cid && enabled,
  });
}

export function usePieceParkStates(cid: string | null, enabled: boolean) {
  return useCurioRpc<PieceParkState[]>("PieceParkStates", [cid ?? ""], {
    enabled: !!cid && enabled,
  });
}

export function useFindContentByCID(cid: string | null) {
  return useCurioRpc<ContentEntry[]>("FindContentByCID", [cid ?? ""], {
    enabled: !!cid,
  });
}

export function useFindEntriesByDataURL(url: string | null) {
  return useCurioRpc<ContentEntry[]>("FindEntriesByDataURL", [url ?? ""], {
    enabled: !!url,
  });
}

export function useChunkUploadStatus(id: string | null) {
  return useCurioRpc<UploadStatusResult>("ChunkUploadStatus", [id ?? ""], {
    enabled: !!id,
  });
}
