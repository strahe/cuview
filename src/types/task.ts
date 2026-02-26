export interface TaskSummary {
  ID: number;
  Name: string;
  SpID: string;
  SincePosted: string;
  SincePostedStr: string;
  Owner?: string;
  OwnerID?: number;
  Miner: string;
}

export interface TaskHistorySummary {
  Name: string;
  TaskID: number;
  Posted: string;
  Start: string;
  Queued: string;
  Took: string;
  Result: boolean;
  Err: string;
  CompletedBy: string;
}

export interface TaskStatus {
  TaskID: number;
  Status: "pending" | "running" | "done" | "failed";
  OwnerID?: number;
  Name: string;
  PostedAt?: string;
}

export interface TaskFilters {
  search: string;
  status: TaskStatus["Status"] | "all";
  hideBgTasks: boolean;
}

export interface TaskDetail {
  ID: number;
  Name: string;
  SpID: string;
  Owner?: string;
  OwnerID?: number;
  Posted: string;
  StartedAt?: string;
  CompletedAt?: string;
  Result?: boolean;
  Err?: string;
  SectorNumber?: number;
  MinerAddr?: string;
}

export interface TaskHistoryEntry {
  TaskID: number;
  Name: string;
  Posted: string;
  Start: string;
  End: string;
  Queued: string;
  Took: string;
  Result: boolean;
  Err: string;
  CompletedBy: string;
  WorkStart: string;
  WorkEnd: string;
}

export interface TaskMachineMapping {
  TaskType: string;
  MachineID: number;
  MachineName: string;
  Enabled: boolean;
}
