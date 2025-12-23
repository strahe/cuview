export interface WinStat {
  Actor: number;
  Epoch: number;
  Block: string;
  TaskID: number;
  SubmittedAt?: string | null;
  Included?: boolean | null;
  BaseComputeTime?: string | null;
  MinedAt?: string | null;
  SubmittedAtStr: string;
  TaskSuccess: string;
  IncludedStr: string;
  ComputeTime: string;
  Miner: string;
}
