import type {
  SqlNullableNumber,
  SqlNullableString,
  SqlNullableTime,
} from "./sql";

// Storage Ask types based on Curio RPC methods

export interface StorageAsk {
  SpID: number;
  Price: number; // attoFIL/GiB/Epoch
  VerifiedPrice: number; // attoFIL/GiB/Epoch
  MinSize: number; // bytes
  MaxSize: number; // bytes
  CreatedAt: number; // unix timestamp
  Expiry: number; // unix timestamp
  Sequence: number;
  Miner: string;
}

export interface PieceSummary {
  total: number;
  indexed: number;
  announced: number;
  last_updated: string;
}

// Combined type for table display (includes actors without asks)
export interface StorageAskWithActor {
  SpID: number;
  Miner: string;
  hasAsk: boolean; // Whether this SP has a storage ask
  // Optional ask fields (present only if hasAsk is true)
  Price?: number;
  VerifiedPrice?: number;
  MinSize?: number;
  MaxSize?: number;
  CreatedAt?: number;
  Expiry?: number;
  Sequence?: number;
}

export interface StorageAskTableEntry extends StorageAskWithActor {
  id: string;
}

// Deal Pipeline types based on Curio RPC methods

export interface MK12Pipeline {
  uuid: string;
  sp_id: number;
  started: boolean;
  piece_cid: string;
  piece_size: number;
  raw_size: number | null;
  offline: boolean;
  url: string | null;
  headers: Record<string, unknown> | null;
  commp_task_id: number | null;
  after_commp: boolean;
  psd_task_id: number | null;
  after_psd: boolean;
  psd_wait_time: string | null;
  find_deal_task_id: number | null;
  after_find_deal: boolean;
  sector: number | null;
  sector_offset: number | null;
  created_at: string;
  indexed: boolean;
  announce: boolean;
  piece_cid_v2: string | null;
  complete: boolean;
  miner: string;
}

export interface PipelineTableEntry extends MK12Pipeline {
  id: string;
}

export interface PipelineFailedStats {
  DownloadingFailed: number;
  CommPFailed: number;
  PSDFailed: number;
  FindDealFailed: number;
  IndexFailed: number;
}

export type FailedTaskType =
  | "downloading"
  | "commp"
  | "psd"
  | "find_deal"
  | "index";

// MK20 pipeline + deal types

export type Mk20FailedTaskType =
  | "downloading"
  | "commp"
  | "aggregate"
  | "index";

export interface Mk20PipelineRaw {
  id: string;
  sp_id: number;
  contract: string;
  client: string;
  piece_cid_v2: string;
  piece_cid: string;
  piece_size: number;
  raw_size: number;
  offline: boolean;
  url: SqlNullableString | string | null;
  indexing: boolean;
  announce: boolean;
  allocation_id: SqlNullableNumber | number | null;
  piece_aggregation: number;
  started: boolean;
  downloaded: boolean;
  commp_task_id: SqlNullableNumber | number | null;
  after_commp: boolean;
  deal_aggregation: number;
  aggr_index: number;
  agg_task_id: SqlNullableNumber | number | null;
  aggregated: boolean;
  duration: number;
  sector: SqlNullableNumber | number | null;
  reg_seal_proof: SqlNullableNumber | number | null;
  sector_offset: SqlNullableNumber | number | null;
  sealed: boolean;
  indexing_created_at: SqlNullableTime | string | null;
  indexing_task_id: SqlNullableNumber | number | null;
  indexed: boolean;
  complete: boolean;
  created_at: string;
  miner: string;
}

export interface Mk20Pipeline {
  id: string;
  sp_id: number;
  contract: string | null;
  client: string;
  piece_cid_v2: string;
  piece_cid: string;
  piece_size: number;
  raw_size: number;
  offline: boolean;
  url: string | null;
  indexing: boolean;
  announce: boolean;
  allocation_id: number | null;
  piece_aggregation: number | null;
  started: boolean;
  downloaded: boolean;
  commp_task_id: number | null;
  after_commp: boolean;
  deal_aggregation: number;
  aggr_index: number;
  agg_task_id: number | null;
  aggregated: boolean;
  duration: number;
  sector: number | null;
  reg_seal_proof: number | null;
  sector_offset: number | null;
  sealed: boolean;
  indexing_created_at: string | null;
  indexing_task_id: number | null;
  indexed: boolean;
  complete: boolean;
  created_at: string;
  miner: string;
}

export interface Mk20PipelineFailedStats {
  DownloadingFailed: number;
  CommPFailed: number;
  AggFailed: number;
  IndexFailed: number;
}

export interface Mk20DealSummaryRaw {
  id: string;
  created_at: string;
  piece_cid_v2: SqlNullableString | string | null;
  processed: boolean;
  error: SqlNullableString | string | null;
  miner: SqlNullableString | string | null;
}

export interface Mk20DealSummary {
  id: string;
  created_at: string;
  piece_cid_v2: string | null;
  processed: boolean;
  error: string | null;
  miner: string | null;
}

export interface Mk20DealDetail {
  deal?: Record<string, unknown>;
  ddoerr?: SqlNullableString | string | null;
  pdperr?: SqlNullableString | string | null;
  ddoid?: SqlNullableNumber | number | null;
}

export interface Mk20PdpDealRaw {
  id: string;
  created_at: string;
  piece_cid_v2: SqlNullableString | string | null;
  processed: boolean;
  error: SqlNullableString | string | null;
}

export interface Mk20PdpDeal {
  id: string;
  created_at: string;
  piece_cid_v2: string | null;
  processed: boolean;
  error: string | null;
}

// Pipeline Stats (from PipelineStatsMarket RPC)
export interface PipelineStage {
  Name: string;
  Pending: number;
  Running: number;
}

export interface PipelineStats {
  Total: number;
  Stages: PipelineStage[];
}

// Pending Deal (from deals.go DealsPending, based on open_sector_pieces table)
export interface OpenDealInfo {
  Actor: number; // sp_id
  SectorNumber: number; // sector_number
  PieceCID: string; // piece_cid
  PieceSize: number; // piece_size (bytes)
  RawSize: number; // data_raw_size (bytes)
  CreatedAt: string; // created_at timestamp
  SnapDeals: boolean; // is_snap
  PieceSizeStr: string; // formatted size string
  CreatedAtStr: string; // formatted date string
  Miner: string; // miner address (f0xxx)
}

// Pending deals table entry
export interface PendingDealTableEntry extends OpenDealInfo {
  id: string; // for table row id
}

// Pricing Filter (from market_filters.go GetPriceFilters)
export interface PricingFilter {
  name: string;
  min_dur: number; // min_duration_days
  max_dur: number; // max_duration_days
  min_size: number; // bytes
  max_size: number; // bytes
  price: number; // attoFIL/GiB/Epoch
  verified: boolean;
}

// Table entry
export interface PricingFilterTableEntry extends PricingFilter {
  id: string;
}

// Client Filter (from market_filters.go GetClientFilters)
export interface ClientFilter {
  name: string;
  active: boolean;
  wallets: string[];
  peer_ids: string[];
  pricing_filters: string[];
  max_deals_per_hour: number;
  max_deal_size_per_hour: number;
  additional_info: string;
}

// Table entry
export interface ClientFilterTableEntry extends ClientFilter {
  id: string;
}

// Allow/Deny Entry (from market_filters.go GetAllowDenyList)
export interface AllowDenyEntry {
  wallet: string;
  status: boolean; // true = allow, false = deny
}

// Table entry
export interface AllowDenyTableEntry extends AllowDenyEntry {
  id: string;
}

export interface DefaultFilterBehaviour {
  allow_deals_from_unknown_clients: boolean;
  is_deal_rejected_when_cid_gravity_not_reachable: boolean;
  cid_gravity_status: Record<string, boolean>;
}
