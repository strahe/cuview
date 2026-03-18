import type { SqlNullableNumber, SqlNullableString } from "@/types/sql";

// Re-export shared nullable extraction helper from canonical location
export { extractNullable } from "@/utils/sql";

// Types for inline data that comes from RPC but isn't in src/types/market.ts

// MK12 deal list item (raw from RPC, StorageDealList in Go)
export interface MK12DealListItem {
  uuid: string;
  sp_id: number;
  created_at: string;
  piece_cid: string;
  piece_size: number;
  raw_size?: SqlNullableNumber | number | null;
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
  deal_id: number;
  piece_cid: string;
  is_ddo: boolean;
  sp_id: number;
  miner: string;
  sector_num: number;
  start_epoch: number;
  end_epoch: number;
  piece_size: number;
}

export interface PieceParkState {
  piece_cid: string;
  state: string;
  complete: boolean;
  created_at: string;
  url?: string;
}

export interface ContentEntry {
  piece_cid: string;
  data_url: string;
  sp_id: number;
  sector_num: number;
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

// Market balance entry (flat row for table)
export interface MarketBalanceEntry {
  Miner: string;
  Balance: string;
  Available: string;
  Locked: string;
}
