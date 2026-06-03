import type { SqlNullableNumber, SqlNullableString } from "@/types/sql";

// Re-export shared nullable extraction helper from canonical location
export { extractNullable } from "@/utils/sql";

// Types for inline data that comes from RPC but isn't in src/types/market.ts

// MK12 deal list item (raw from RPC, StorageDealList in Go)
export interface MK12DealListItem {
  id: string;
  sp_id: number;
  created_at: string;
  piece_cid: string;
  piece_size: number;
  RawSize?: SqlNullableNumber | number | null;
  piece_cid_v2?: string;
  processed: boolean;
  error?: SqlNullableString | string | null;
  miner: string;
}

// MK20 deal list item (raw from RPC, MK20StorageDealList in Go)
export interface MK20DealListItem {
  id: string;
  created_at: string;
  piece_cid_v2?: SqlNullableString | string | null;
  processed: boolean;
  error?: SqlNullableString | string | null;
  miner?: SqlNullableString | string | null;
}

// MK20 deal detail (from MK20DDOStorageDeal RPC)
export interface MK20DealDetailResponse {
  deal?: Record<string, unknown>;
  ddoerr?: SqlNullableString | string | null;
  pdperr?: SqlNullableString | string | null;
  ddoid?: SqlNullableNumber | number | null;
}

// Piece lookup types
export interface PieceDeal {
  id: string;
  sp_id: number;
  miner: string;
  chain_deal_id: number;
  sector: number;
  length: number;
  raw_size: number;
  offset?: SqlNullableNumber | null;
  mk20: boolean;
  boost_deal: boolean;
  legacy_deal: boolean;
}

export interface PieceInfoResult {
  piece_cid_v2: string;
  piece_cid: string;
  size: number;
  ipni_ads: string[] | null;
  created_at: string;
  indexed_at: string;
  indexed: boolean;
  deals: PieceDeal[] | null;
}

export interface PieceDealDetailItem {
  uuid: string;
  piece_cid: string;
  sp_id: number;
  addr?: string;
  start_epoch: number;
  end_epoch: number;
  piece_size: number;
  is_ddo?: boolean;
}

export interface PieceDealDetailResponse {
  mk12?: Array<{
    deal?: PieceDealDetailItem | null;
    mk12_pipeline?: Record<string, unknown> | null;
  } | null> | null;
  mk20?: Array<{
    deal?: MK20DealDetailResponse | null;
    mk20_ddo_pipeline?: Record<string, unknown> | null;
    mk20_pdp_pipeline?: Record<string, unknown> | null;
  } | null> | null;
}

export interface PieceParkState {
  id: number;
  piece_cid: string;
  piece_padded_size: number;
  piece_raw_size: number;
  complete: boolean;
  created_at: string;
  task_id?: SqlNullableNumber | number | null;
  cleanup_task_id?: SqlNullableNumber | number | null;
  refs?: PieceParkRef[] | null;
}

export interface PieceParkRef {
  ref_id: number;
  piece_id: number;
  data_url?: SqlNullableString | string | null;
  data_headers?: Record<string, unknown> | null;
}

export interface ContentInfo {
  piece_cid: string;
  offset: number;
  size: number;
  err?: string;
}

export interface PieceParkRefEntry {
  table_name: string;
  sp_id: number;
  sector_number?: number;
  piece_index?: number;
  piece_cid: string;
  deal_uuid?: string;
  addr: string;
}

export interface ContentSearchResult {
  pieceCid: string;
  details: string[];
  error?: string;
}

export interface UploadStatusResult {
  id: string;
  status: string;
}

// MK12 deal detail (from StorageDealInfo RPC)
export interface StorageDealDetail {
  id: string;
  sp_id: number;
  sector?: SqlNullableNumber | null;
  created_at: string;
  signed_proposal_cid: string;
  offline: boolean;
  verified: boolean;
  start_epoch: number;
  end_epoch: number;
  client_peer_id: string;
  chain_deal_id?: SqlNullableNumber | null;
  publish_cid?: SqlNullableString | null;
  piece_cid: string;
  piece_size: number;
  fast_retrieval: boolean;
  announce_to_ipni: boolean;
  url?: string;
  url_headers?: Record<string, string[]>;
  error?: string;
  miner: string;
  indexed?: { Valid: boolean; Bool: boolean } | null;
  is_ddo: boolean;
  piece_cid_v2: string;
}

// Curio API response for MarketBalance RPC
export interface WalletBalance {
  address: string;
  balance: string;
}

export interface MarketBalanceStatus {
  miner: string;
  market_balance: string;
  balances: WalletBalance[] | null;
}

// Adapted display type for the balance table
export interface MarketBalanceEntry {
  miner: string;
  marketBalance: string;
  wallets: WalletBalance[];
}
