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
  End: string;
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
