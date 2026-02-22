export interface StorageUseStat {
  can_seal: boolean;
  can_store: boolean;
  Type: string;
  Capacity: number;
  Available: number;
  UseStr?: string;
  CapStr?: string;
  subEntries?: StorageBreakdown[];
}

export interface StorageBreakdown {
  type: string;
  capacity: number;
  available: number;
  avail_str: string;
}

export interface StorageGCStatsEntry {
  storage_id: string;
  sector_count: number;
  approved_count: number;
  unapproved_count: number;
  total_size: number;
}

export interface StorageGCMark {
  id: number;
  storage_id: string;
  sp_id: number;
  sector_num: number;
  file_type: string;
  approved: boolean;
  approved_at?: string;
  created_at: string;
  miner: string;
}

export interface StorageGCMarksResponse {
  Marks: StorageGCMark[];
  Total: number;
}

export interface StorageStoreStats {
  Type: string;
  Count: number;
  Size: number;
  SizeStr: string;
}

export interface StoragePathInfo {
  StorageID: string;
  PathType: string;
  CapacityStr: string;
  AvailableStr: string;
  UsedStr: string;
  UsedPercent: number;
  HealthStatus: string;
  HealthOK: boolean;
  CanSeal?: boolean;
  CanStore?: boolean;
  Capacity?: number;
  Available?: number;
  Used?: number;
  URLList?: string[];
  HostList?: string[];
  GroupList?: string[];
  AllowToList?: string[];
  AllowTypesList?: string[];
  DenyTypesList?: string[];
  AllowMinersList?: string[];
  DenyMinersList?: string[];
  Weight?: number;
  MaxStorage?: number;
  MaxStorageStr?: string;
  ReservedStr?: string;
  ReservedPercent?: number;
  FSAvailableStr?: string;
  LastHeartbeat?: string;
  HeartbeatErr?: string;
}

export interface StoragePathURLLiveness {
  URL: string;
  LastChecked: string;
  LastLive?: string;
  LastDead?: string;
  LastDeadReason?: string;
  IsLive: boolean;
  Host: string;
  LastCheckedStr: string;
  LastLiveStr?: string;
  LastDeadStr?: string;
}

export interface StoragePathDetailGCMark {
  MinerID: number;
  SectorNum: number;
  FileType: number;
  CreatedAt: string;
  Approved: boolean;
  Miner: string;
  FileTypeStr: string;
  CreatedAtStr: string;
}

export interface StoragePathTypeSummary {
  FileType: string;
  Count: number;
  Primary: number;
}

export interface StoragePathMinerSummary {
  Miner: string;
  Count: number;
  Primary: number;
}

export interface StoragePathDetailResult {
  Info: StoragePathInfo;
  URLs: StoragePathURLLiveness[];
  GCMarks: StoragePathDetailGCMark[];
  TotalSectorEntries: number;
  PrimaryEntries: number;
  SecondaryEntries: number;
  ByType: StoragePathTypeSummary[];
  ByMiner: StoragePathMinerSummary[];
  PendingGC: number;
  ApprovedGC: number;
}

export interface StoragePathSector {
  MinerID: number;
  SectorNum: number;
  FileType: number;
  IsPrimary: boolean;
  ReadRefs: number;
  HasWriteLock: boolean;
  FileTypeStr: string;
  MinerStr: string;
}

export interface StoragePathSectorsResult {
  Sectors: StoragePathSector[];
  Total: number;
}
