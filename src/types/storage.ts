// Matches Go StorageUseStats (no json tags = PascalCase field names)
export interface StorageUseStat {
  CanSeal: boolean;
  CanStore: boolean;
  Type: string;
  Capacity: number;
  Available: number;
  UseStr?: string;
  CapStr?: string;
}

// Matches Go StorageStoreStats (snake_case json tags)
export interface StorageStoreStats {
  type: string;
  capacity: number;
  available: number;
  used: number;
  cap_str: string;
  use_str: string;
  avail_str: string;
}

// Matches Go StorageGCStats (no json tags = PascalCase field names)
export interface StorageGCStatsEntry {
  Actor: number;
  Count: number;
  Miner: string;
}

// Matches Go StorageGCMark (no json tags = PascalCase field names)
export interface StorageGCMark {
  Actor: number;
  SectorNum: number;
  FileType: number;
  StorageID: string;
  CreatedAt: string;
  Approved: boolean;
  ApprovedAt?: string;
  CanSeal: boolean;
  CanStore: boolean;
  Urls: string;
  TypeName: string;
  PathType: string;
  Miner: string;
}

export interface StorageGCMarksResponse {
  Marks: StorageGCMark[];
  Total: number;
}

// Matches Go StorageStoreStats (already correct above)

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
  Miner: string;
}

export interface StoragePathSectorsResult {
  Sectors: StoragePathSector[];
  Total: number;
}
