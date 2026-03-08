import type { SectorListEntry, SnapSectorEntry } from "@/types/pipeline";

// ---------------------------------------------------------------------------
// PoRep view types
// ---------------------------------------------------------------------------

export type PorepStage =
  | "Pending"
  | "SDR"
  | "Trees"
  | "PreCommit"
  | "WaitSeed"
  | "PoRep"
  | "Commit"
  | "Done"
  | "Failed";

export interface PorepSectorView {
  spId: number;
  sectorNumber: number;
  address: string;
  createTime: string;
  stage: PorepStage;
  isRunning: boolean;
  activeTaskId: number | null;
  failed: boolean;
  failedReason: string;
  // Chain state
  chainAlloc: boolean;
  chainSector: boolean;
  chainActive: boolean;
  chainUnproven: boolean;
  chainFaulty: boolean;
  // Detail fields for sub-row
  preCommitMsgCid: string | null;
  commitMsgCid: string | null;
  seedEpoch: number | null;
  runningStages: string[];
  // Original for reference
  raw: SectorListEntry;
}

export interface PorepActorRow {
  actor: string;
  countSDR: number;
  countTrees: number;
  countPrecommit: number;
  countWaitSeed: number;
  countPoRep: number;
  countCommit: number;
  countDone: number;
  countFailed: number;
}

export interface PorepTotals {
  sdr: number;
  trees: number;
  precommit: number;
  waitSeed: number;
  porep: number;
  commit: number;
  done: number;
  failed: number;
}

// ---------------------------------------------------------------------------
// Snap view types
// ---------------------------------------------------------------------------

export type SnapStage =
  | "Pending"
  | "Encode"
  | "Prove"
  | "Submit"
  | "MoveStorage"
  | "Done"
  | "Failed";

export interface SnapSectorView {
  spId: number;
  sectorNumber: number;
  address: string;
  startTime: string;
  stage: SnapStage;
  activeTaskId: number | null;
  failed: boolean;
  failedReason: string;
  failedReasonMsg: string;
  updateReadyAt: string | null;
  // Original for reference
  raw: SnapSectorEntry;
}

export interface SnapActorRow {
  actor: string;
  countEncode: number;
  countProve: number;
  countSubmit: number;
  countMoveStorage: number;
  countDone: number;
  countFailed: number;
}

export interface SnapTotals {
  encode: number;
  prove: number;
  submit: number;
  moveStorage: number;
  done: number;
  failed: number;
}

// ---------------------------------------------------------------------------
// Sector action types (shared by PoRep and Snap)
// ---------------------------------------------------------------------------

export type PorepSectorActionType = "resume" | "remove" | "restart";

// ---------------------------------------------------------------------------
// Re-export API types for convenience
// ---------------------------------------------------------------------------

export type {
  PipelineStage,
  PipelineStats,
  PipelineWaterfallStats,
  PorepPipelineSummary,
  SectorListEntry,
  SnapSectorEntry,
} from "@/types/pipeline";
