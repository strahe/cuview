export interface MachineSummary {
  Address: string;
  ID: number;
  Name: string;
  SinceContact: string;
  Tasks: string;
  Cpu: number;
  RamHumanized: string;
  Gpu: number;
  Layers: string;
  Uptime: string;
  Unschedulable: boolean;
  RunningTasks: number;
  Restarting?: boolean;
  RestartRequest?: string;
}

export interface MachineInfo {
  Info: {
    Name: string;
    Host: string;
    ID: number;
    LastContact: string;
    CPU: number;
    Memory: number;
    GPU: number;
    Layers: string;
    Unschedulable: boolean;
    RunningTasks: number;
  };
  Storage: Array<{
    ID: string;
    Weight: number;
    MaxStorage: number;
    CanSeal: boolean;
    CanStore: boolean;
    Groups: string;
    AllowTo: string;
    AllowTypes: string;
    DenyTypes: string;
    Capacity: number;
    Available: number;
    FSAvailable: number;
    Reserved: number;
    Used: number;
    AllowMiners: string;
    DenyMiners: string;
    LastHeartbeat: string;
    HeartbeatErr?: string;
    UsedPercent: number;
    ReservedPercent: number;
  }>;
  RunningTasks: Array<{
    ID: number;
    Task: string;
    Posted: string;
    PoRepSector?: number;
    PoRepSectorSP?: number;
    PoRepSectorMiner: string;
  }>;
  FinishedTasks: Array<{
    ID: number;
    Task: string;
    Posted: string;
    Start: string;
    Queued: string;
    Took: string;
    Outcome: string;
    Message: string;
  }>;
}

export interface MachineFilters {
  search: string;
  status: "all" | "online" | "offline" | "unschedulable";
  taskFilter: string;
}
