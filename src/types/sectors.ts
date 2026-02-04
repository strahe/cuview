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

export interface SectorPieceMeta {
  PieceCID: string;
  PieceSize: number;
  DealID?: number;
  DataURL?: string;
}

export interface LocationTable {
  StorageID: string;
  FileType: string;
  ReadTs?: string;
  ReadRefs?: number;
  WriteTs?: string;
  WriteLock?: boolean;
}

export interface SectorInfoTaskSummary {
  ID: number;
  Name: string;
  Posted: string;
  Owner?: string;
}

export interface TaskHistory {
  ID: number;
  Name: string;
  Posted: string;
  Start: string;
  Queued: string;
  Took: string;
  Result: boolean;
  Err: string;
  CompletedBy: string;
}

export interface SectorPartitionState {
  Live: boolean;
  Active: boolean;
  Faulty: boolean;
  Recovering: boolean;
  Terminated: boolean;
  Unproven: boolean;
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
