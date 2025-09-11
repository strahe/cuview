export interface SectorListEntry {
  // Embedded PipelineTask fields
  SpID: number;
  SectorNumber: number;
  CreateTime: string;

  // Task IDs (nullable)
  TaskSDR?: number;
  TaskTreeD?: number;
  TaskTreeC?: number;
  TaskTreeR?: number;
  TaskSynthetic?: number;
  TaskPrecommitMsg?: number;
  TaskPoRep?: number;
  TaskFinalize?: number;
  TaskMoveStorage?: number;
  TaskCommitMsg?: number;

  // After flags
  AfterSDR: boolean;
  AfterTreeD: boolean;
  AfterTreeC: boolean;
  AfterTreeR: boolean;
  AfterSynthetic: boolean;
  AfterPrecommitMsg: boolean;
  AfterPrecommitMsgSuccess: boolean;
  AfterPoRep: boolean;
  AfterFinalize: boolean;
  AfterMoveStorage: boolean;
  AfterCommitMsg: boolean;
  AfterCommitMsgSuccess: boolean;

  // Started flags
  StartedSDR: boolean;
  StartedTreeD: boolean;
  StartedTreeRC: boolean;
  StartedSynthetic: boolean;
  StartedPrecommitMsg: boolean;
  StartedPoRep: boolean;
  StartedFinalize: boolean;
  StartedMoveStorage: boolean;
  StartedCommitMsg: boolean;

  // Optional fields
  TreeD?: string;
  TreeR?: string;
  PreCommitReadyAt?: string;
  PreCommitMsgCid?: string;
  SeedEpoch?: number;
  PoRepProof?: string;
  CommitReadyAt?: string;
  CommitMsgCid?: string;

  // Failure information
  Failed: boolean;
  FailedReason: string;

  // Task arrays
  MissingTasks: number[];
  AllTasks: number[];

  // Additional sectorListEntry fields
  Address: string;
  AfterSeed: boolean;
  ChainAlloc: boolean;
  ChainSector: boolean;
  ChainActive: boolean;
  ChainUnproven: boolean;
  ChainFaulty: boolean;
}

export interface PorepPipelineSummary {
  Actor: string;
  CountSDR: number;
  CountTrees: number;
  CountPrecommitMsg: number;
  CountWaitSeed: number;
  CountPoRep: number;
  CountCommitMsg: number;
  CountDone: number;
  CountFailed: number;
}

export interface PipelineStats {
  TotalSectors: number;
  CompletedSectors: number;
  FailedSectors: number;
  InProgressSectors: number;
  PendingSectors: number;
  SuccessRate: number;
  AverageTimePerSector?: string;
  LastUpdated: string;
}

export interface PipelineFailedStats {
  TaskType: string;
  Count: number;
  LastFailure?: string;
  CommonError?: string;
}

export interface PipelineTaskDetails {
  SectorNumber: number;
  SP: string;
  TaskName: string;
  Stage: string;
  Status: "pending" | "running" | "completed" | "failed";
  StartedAt?: string;
  CompletedAt?: string;
  Error?: string;
  Owner?: string;
  OwnerID?: number;
  Progress?: number;
}

export interface PipelineFilters {
  search: string;
  status: "all" | "pending" | "running" | "completed" | "failed";
  spFilter: string;
  stageFilter: string;
}

export interface PipelineOverviewStats {
  porepStats: PipelineStats;
  snapStats: PipelineStats;
  totalActiveSectors: number;
  totalFailedTasks: number;
  lastUpdate: string;
}

export interface SnapSectorEntry {
  SpID: number;
  SectorNumber: number;
  StartTime: string;
  UpgradeProof: number;
  DataAssigned: boolean;
  UpdateUnsealedCid?: string;
  UpdateSealedCid?: string;

  // Task IDs (nullable)
  TaskIDEncode?: number;
  TaskIDProve?: number;
  TaskIDSubmit?: number;
  TaskIDMoveStorage?: number;

  // After flags
  AfterEncode: boolean;
  AfterProve: boolean;
  AfterSubmit: boolean;
  AfterMoveStorage: boolean;
  AfterProveMsgSuccess: boolean;

  // Proof and submission data
  Proof?: string;
  ProveMsgCid?: string;
  ProveMsgTsk?: string;
  SubmitAfter?: string;
  UpdateReadyAt?: string;

  // Failure information
  Failed: boolean;
  FailedAt?: string;
  FailedReason: string;
  FailedReasonMsg: string;

  // Computed fields for display
  Address?: string;
  CurrentState?: string;
  Progress?: number;
}

export interface SnapPipelineSummary {
  Actor: string;
  CountEncode: number;
  CountProve: number;
  CountSubmit: number;
  CountMoveStorage: number;
  CountDone: number;
  CountFailed: number;
}
