export interface PdpService {
  id: number;
  name: string;
  pubkey: string;
}

export interface PdpServicePayload {
  name: string;
  publicKey: string;
}

export interface PdpKeyPayload {
  privateKey: string;
}

export type PdpFailedTaskType =
  | "downloading"
  | "commp"
  | "aggregate"
  | "add_piece"
  | "save_cache"
  | "index";

export interface PdpPipeline {
  id: string;
  client: string;
  piece_cid_v2: string;
  indexing: boolean;
  announce: boolean;
  announce_payload: boolean;
  downloaded: boolean;
  commp_task_id: number | null;
  after_commp: boolean;
  deal_aggregation: number;
  aggr_index: number;
  agg_task_id: number | null;
  aggregated: boolean;
  add_piece_task_id: number | null;
  after_add_piece: boolean;
  after_add_piece_msg: boolean;
  save_cache_task_id: number | null;
  after_save_cache: boolean;
  indexing_created_at: string | null;
  indexing_task_id: number | null;
  indexed: boolean;
  complete: boolean;
  created_at: string;
  miner: string;
}

export interface PdpPipelineFailedStats {
  DownloadingFailed: number;
  CommPFailed: number;
  AggFailed: number;
  AddPieceFailed: number;
  SaveCacheFailed: number;
  IndexFailed: number;
}
