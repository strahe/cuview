export interface SectorListItem {
  MinerID: number;
  SectorNum: number;
  MinerAddress: string;
  HasSealed: boolean;
  HasUnsealed: boolean;
  HasSnap: boolean;
  ExpiresAt: number;
  IsOnChain: boolean;
  IsFilPlus: boolean;
  SealInfo: string;
  Proving: boolean;
  Flag: boolean;
  DealWeight: string;
  Deals: string;
}

export interface SectorTerminationPayload {
  MinerAddress: string;
  Sector: number;
}

// Matches Go SectorPieceMeta (no json tags = PascalCase field names)
export interface SectorPieceMeta {
  PieceIndex: number;
  PieceSize: number;
  PieceCid: string;
  PieceCidV2: string;
  DataRawSize: { Int64: number; Valid: boolean };
  F05DealID: { Int64: number; Valid: boolean };
  DealID: { String: string; Valid: boolean };
  IsSnapPiece: boolean;
  DataUrl: { String: string; Valid: boolean };
  F05PublishCid: { String: string; Valid: boolean };
  DDOPam: { String: string; Valid: boolean };
  StrPieceSize: string;
  StrDataRawSize: string;
  PieceParkDataUrl: string;
  PieceParkCreatedAt: string;
  PieceParkID: number;
  PieceParkTaskID: number | null;
  PieceParkCleanupTaskID: number | null;
  MK12Deal: { Bool: boolean; Valid: boolean };
  LegacyDeal: { Bool: boolean; Valid: boolean };
  DeleteOnFinalize: { Bool: boolean; Valid: boolean };
  IsParkedPiece: boolean;
  IsParkedPieceFound: boolean;
  PieceParkComplete: boolean;
}

// Matches Go LocationTable (no json tags = PascalCase)
export interface LocationTable {
  PathType: string | null;
  PathTypeRowSpan: number;
  FileType: string | null;
  FileTypeRowSpan: number;
  Locations: FileLocations[];
}

export interface FileLocations {
  StorageID: string;
  Urls: string[];
}

// Matches Go SectorInfoTaskSummary (no json tags = PascalCase)
export interface SectorInfoTaskSummary {
  ID: number;
  Name: string;
  SincePosted: string;
  Owner?: string;
  OwnerID?: string;
}

// Matches Go TaskHistory (no json tags = PascalCase field names)
export interface TaskHistory {
  PipelineTaskID: number;
  WorkStart: { Time: string; Valid: boolean };
  WorkEnd: { Time: string; Valid: boolean };
  Name: { String: string; Valid: boolean };
  CompletedBy: { String: string; Valid: boolean };
  Result: { Bool: boolean; Valid: boolean };
  Err: { String: string; Valid: boolean };
  Took: string;
}

// Matches Go SectorPartitionState (snake_case json tags)
export interface SectorPartitionState {
  deadline: number;
  partition: number;
  in_all_sectors: boolean;
  in_live_sectors: boolean;
  in_active_sectors: boolean;
  in_faulty_sectors: boolean;
  in_recovering_sectors: boolean;
  in_unproven_sectors: boolean;
  partition_post_submitted: boolean;
  is_current_deadline: boolean;
  epochs_until_proof?: number;
  hours_until_proof?: string;
}

export interface SectorDetail {
  SectorNumber: number;
  SpID: number;
  Miner: string;
  PreCommitMsg: string;
  CommitMsg: string;
  ActivationEpoch: number;
  ExpirationEpoch?: number;
  DealWeight: string;
  Deadline?: number;
  Partition?: number;
  UnsealedCid: string;
  SealedCid: string;
  UpdatedUnsealedCid: string;
  UpdatedSealedCid: string;
  IsSnap: boolean;
  UpdateMsg: string;
  UnsealedState?: boolean;
  HasUnsealed: boolean;
  HasSealed: boolean;
  HasUpdate: boolean;
  PartitionState?: SectorPartitionState;
  Pieces: SectorPieceMeta[];
  Locations: LocationTable[];
  Tasks: SectorInfoTaskSummary[];
  TaskHistory: TaskHistory[];
  Resumable: boolean;
  Restart: boolean;
}

export interface SPSectorStats {
  sp_id: number;
  sp_address: string;
  total_count: number;
  cc_count: number;
  non_cc_count: number;
}

export interface SectorPipelineStatsEntry {
  pipeline_type: string;
  stage: string;
  count: number;
}

export interface DeadlineStats {
  sp_id: number;
  sp_address: string;
  deadline: number;
  count: number;
  all_sectors: number;
  faulty_sectors: number;
  recovering_sectors: number;
  live_sectors: number;
  active_sectors: number;
  post_submissions: string;
}

export interface SectorFileTypeStatsEntry {
  file_type: string;
  count: number;
}
