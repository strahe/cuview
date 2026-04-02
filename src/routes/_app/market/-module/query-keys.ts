export const marketQueryKeys = {
  // Balance
  balance: ["curio", "MarketBalance"],

  // Actors
  actorList: ["curio", "ActorList"],

  // Asks
  asks: ["curio", "GetStorageAsk"],

  // Pending
  pending: ["curio", "DealsPending"],

  // Pieces
  pieceSummary: ["curio", "PieceSummary"],
  pieceInfo: (cid: string) => ["curio", "PieceInfo", cid] as const,
  pieceDealDetail: (cid: string) => ["curio", "PieceDealDetail", cid] as const,
  pieceParkStates: (cid: string) => ["curio", "PieceParkStates", cid] as const,
  findContentByCID: (cid: string) =>
    ["curio", "FindContentByCID", cid] as const,
  findEntriesByDataURL: (url: string) =>
    ["curio", "FindEntriesByDataURL", url] as const,
  storageDealInfo: (id: string) => ["curio", "StorageDealInfo", id] as const,
  chunkUploadStatus: (id: string) =>
    ["curio", "ChunkUploadStatus", id] as const,

  // MK12
  mk12Pipelines: ["curio", "GetMK12DealPipelines"],
  mk12Deals: ["curio", "MK12StorageDealList"],
  mk12DDODeals: ["curio", "MK12DDOStorageDealList"],
  mk12FailedTasks: ["curio", "MK12PipelineFailedTasks"],

  // MK20
  mk20Pipelines: ["curio", "MK20DDOPipelines"],
  mk20Deals: ["curio", "MK20DDOStorageDeals"],
  mk20FailedTasks: ["curio", "MK20PipelineFailedTasks"],
  mk20DealDetail: (id: string) => ["curio", "MK20DDOStorageDeal", id] as const,

  // Settings - Filters
  pricingFilters: ["curio", "GetPriceFilters"],
  clientFilters: ["curio", "GetClientFilters"],
  allowDenyList: ["curio", "GetAllowDenyList"],
  defaultFilter: ["curio", "DefaultFilterBehaviour"],

  // Settings - Products/Contracts (will be in MK20 page)
  products: ["curio", "ListProducts"],
  dataSources: ["curio", "ListDataSources"],
  contracts: ["curio", "ListMarketContracts"],
};

// Invalidation key groups
export const balanceInvalidateKeys: unknown[][] = [marketQueryKeys.balance];

export const asksInvalidateKeys: unknown[][] = [
  marketQueryKeys.asks,
  marketQueryKeys.actorList,
];

export const pendingInvalidateKeys: unknown[][] = [marketQueryKeys.pending];

export const mk12InvalidateKeys: unknown[][] = [
  marketQueryKeys.mk12Pipelines,
  marketQueryKeys.mk12Deals,
  marketQueryKeys.mk12DDODeals,
  marketQueryKeys.mk12FailedTasks,
];

export const mk20InvalidateKeys: unknown[][] = [
  marketQueryKeys.mk20Pipelines,
  marketQueryKeys.mk20Deals,
  marketQueryKeys.mk20FailedTasks,
];

export const filtersInvalidateKeys: unknown[][] = [
  marketQueryKeys.pricingFilters,
  marketQueryKeys.clientFilters,
  marketQueryKeys.allowDenyList,
  marketQueryKeys.defaultFilter,
];

export const productsInvalidateKeys: unknown[][] = [
  marketQueryKeys.products,
  marketQueryKeys.dataSources,
  marketQueryKeys.contracts,
];
