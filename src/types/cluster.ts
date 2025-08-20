export interface ClusterMachine {
  ID: number;
  Name: string;
  Address: string;
  Cpu: number;
  RamHumanized: string;
  Gpu: number;
  SinceContact: string;
  Uptime: string;
  Unschedulable: boolean;
  Restarting: boolean;
  RunningTasks: number;
  RestartRequest: string;
  Tasks: string;
  Layers: string;
}

export interface HarmonyTaskStat {
  Name: string;
  TrueCount: number;
  FalseCount: number;
  TotalCount: number;
}

export interface TaskStatWithPercentage extends HarmonyTaskStat {
  FailedPercentage: string;
  isError: boolean;
}
