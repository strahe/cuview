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

export interface RawTaskStatusSnake {
  task_id: number;
  status: string;
  owner_id?: number;
  name: string;
  posted_at?: string;
}

export interface RawHarmonyTaskMachine {
  MachineID?: number;
  machine_id?: number;
  Name?: string;
  machine_name?: string;
  MachineAddr?: string;
  host_and_port?: string;
  Actors?: string;
  miners?: string;
}

export interface RawHarmonyTaskDetail {
  ID: number;
  Name: string;
  UpdateTime: string;
  PostedTime: string;
  OwnerID: number;
  OwnerAddr: string;
  OwnerName: string;
}

export interface RawHarmonyTaskHistoryEntry {
  ID: number;
  TaskID: number;
  Name: string;
  WorkStart: string;
  WorkEnd: string;
  Posted: string;
  Took?: string;
  Result: boolean;
  Err: string;
  CompletedBy: string;
  CompletedById?: number;
  CompletedByName?: string;
  Events?: Array<{
    SpID?: number;
    SectorNumber?: number;
  }>;
}
