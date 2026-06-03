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
  name: string;
  success: number;
  failure: number;
  total: number;
}

export interface TaskStatWithPercentage extends HarmonyTaskStat {
  isError: boolean;
}
