import type { SqlNullableString } from "@/types/sql";

// ---------------------------------------------------------------------------
// PDP Service
// ---------------------------------------------------------------------------

export interface PdpService {
  id: number;
  name: string;
  pubkey: string;
}

// ---------------------------------------------------------------------------
// FS Registry
// ---------------------------------------------------------------------------

export interface FSPDPOffering {
  service_url: string;
  min_size: number;
  max_size: number;
  ipni_piece: boolean;
  ipni_ipfs: boolean;
  ipni_peer_id: string;
  price: number;
  min_proving_period: number;
  location: string;
  payment_token_address: string;
}

export interface FSRegistryStatus {
  address: string;
  id: number;
  /** JSON tag is "status" in Go, maps to boolean active state */
  status: boolean;
  name: string;
  description: string;
  payee: string;
  pdp_service: FSPDPOffering | null;
  capabilities: Record<string, string>;
}

// ---------------------------------------------------------------------------
// PDP Pipeline
// ---------------------------------------------------------------------------

export type { PdpFailedTaskType, PdpPipeline } from "@/types/pdp";

export interface PdpPipelineFailedStats {
  DownloadingFailed: number;
  CommPFailed: number;
  AggFailed: number;
  AddPieceFailed: number;
  SaveCacheFailed: number;
  IndexFailed: number;
}

// ---------------------------------------------------------------------------
// PDP Deals
// ---------------------------------------------------------------------------

export interface PdpDealListItem {
  id: string;
  created_at: string;
  piece_cid_v2: SqlNullableString | null;
  processed: boolean;
  error: SqlNullableString | null;
}
