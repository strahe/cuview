export interface StorageUseStat {
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

export interface StorageGCStats {
  sp_id: number;
  count: number;
  Miner: string;
}

export interface StorageGCMark {
  sp_id: number;
  sector_num: number;
  sector_filetype: number;
  storage_id: string;
  created_at: string;
  approved: boolean;
  approved_at?: string;
  can_seal: boolean;
  can_store: boolean;
  urls: string;
  TypeName: string;
  PathType: string;
  Miner: string;
}

export interface StoragePathInfo {
  ID: string;
  Machine: string;
  MachineID: number;
  CanSeal: boolean;
  CanStore: boolean;
  Capacity: number;
  Available: number;
  Used: number;
  UsedPercent: number;
  LastHeartbeat: string;
  HeartbeatErr?: string;
  HealthStatus: "healthy" | "warning" | "error";
}
