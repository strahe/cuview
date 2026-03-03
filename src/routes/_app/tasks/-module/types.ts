export type TaskResultFilter = "all" | "success" | "failed";
export type TaskRuntimeStatus =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "unknown";

export interface TaskSearchState {
  q: string;
  showBg: boolean;
  coalesce: boolean;
  result: TaskResultFilter;
  taskType: string;
  taskId: number | null;
  limit: number;
  offset: number;
}

export type TaskSearchPatch = Partial<TaskSearchState>;

export interface ApiTaskSummary {
  ID?: number;
  id?: number;
  Name?: string;
  name?: string;
  SpID?: string;
  sp_id?: string;
  Miner?: string;
  miner?: string;
  SincePosted?: string;
  since_posted?: string;
  SincePostedStr?: string;
  since_posted_str?: string;
  Owner?: string;
  owner?: string;
  OwnerID?: number;
  owner_id?: number;
}

export interface ApiTaskHistorySummary {
  TaskID?: number;
  task_id?: number;
  Name?: string;
  name?: string;
  Posted?: string;
  posted?: string;
  Start?: string;
  start?: string;
  Queued?: string;
  queued?: string;
  Took?: string;
  took?: string;
  Result?: boolean;
  result?: boolean;
  Err?: string;
  err?: string;
  CompletedBy?: string;
  completed_by?: string;
}

export interface ApiTaskStatus {
  TaskID?: number;
  task_id?: number;
  Status?: string;
  status?: string;
  OwnerID?: number;
  owner_id?: number;
  Name?: string;
  name?: string;
  PostedAt?: string;
  posted_at?: string;
}

export interface ApiTaskMachine {
  MachineID?: number;
  machine_id?: number;
  Name?: string;
  machine_name?: string;
  MachineAddr?: string;
  host_and_port?: string;
  Actors?: string;
  miners?: string;
}

export interface ApiTaskStat {
  Name?: string;
  name?: string;
  TrueCount?: number;
  true_count?: number;
  FalseCount?: number;
  false_count?: number;
  TotalCount?: number;
  total_count?: number;
}

export interface ApiTaskDetail {
  ID?: number;
  id?: number;
  Name?: string;
  name?: string;
  UpdateTime?: string;
  update_time?: string;
  PostedTime?: string;
  posted_time?: string;
  OwnerID?: number;
  owner_id?: number;
  OwnerAddr?: string;
  owner_addr?: string;
  OwnerName?: string;
  owner_name?: string;
}

export interface ApiTaskHistoryEntry {
  ID?: number;
  id?: number;
  TaskID?: number;
  task_id?: number;
  Name?: string;
  name?: string;
  WorkStart?: string;
  work_start?: string;
  WorkEnd?: string;
  work_end?: string;
  Posted?: string;
  posted?: string;
  Took?: string;
  took?: string;
  Result?: boolean;
  result?: boolean;
  Err?: string;
  err?: string;
  CompletedBy?: string;
  completed_by_host_and_port?: string;
  CompletedById?: number;
  completed_by_machine?: number;
  CompletedByName?: string;
  completed_by_machine_name?: string;
  Events?: Array<{
    SpID?: number;
    sp_id?: number;
    SectorNumber?: number;
    sector_number?: number;
  }>;
}

export interface TaskSummaryView {
  id: number;
  name: string;
  spId: string;
  miner: string;
  sincePosted: string;
  sincePostedStr: string;
  owner: string;
  ownerId: number | null;
  status: "pending" | "running";
  isBackground: boolean;
}

export interface TaskHistorySummaryView {
  taskId: number;
  name: string;
  posted: string;
  start: string;
  queued: string;
  took: string;
  result: boolean;
  err: string;
  completedBy: string;
}

export interface TaskStatusView {
  taskId: number;
  status: TaskRuntimeStatus;
  ownerId: number | null;
  name: string;
  postedAt: string | null;
}

export interface TaskMachineView {
  machineId: number;
  name: string;
  address: string;
  actors: string;
}

export interface TaskStatView {
  name: string;
  trueCount: number;
  falseCount: number;
  totalCount: number;
  successRate: number;
  runningMachines: number;
}

export interface TaskDetailView {
  id: number;
  name: string;
  updateTime: string;
  postedTime: string;
  ownerId: number | null;
  ownerAddr: string;
  ownerName: string;
}

export interface TaskHistoryEntryView {
  id: number;
  taskId: number;
  name: string;
  workStart: string;
  workEnd: string;
  posted: string;
  took: string;
  result: boolean;
  err: string;
  completedBy: string;
  completedById: number | null;
  completedByName: string;
  eventCount: number;
}

export interface TaskQueueTaskRow {
  kind: "task";
  id: string;
  task: TaskSummaryView;
}

export interface TaskQueueCoalescedRow {
  kind: "coalesced";
  id: string;
  taskName: string;
  spId: string;
  ownerId: number | null;
  count: number;
}

export type TaskQueueRow = TaskQueueTaskRow | TaskQueueCoalescedRow;
