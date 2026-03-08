import type {
  PipelineWaterfallStats,
  PorepPipelineSummary,
  SectorListEntry,
  SnapSectorEntry,
} from "@/types/pipeline";
import type {
  PorepActorRow,
  PorepSectorView,
  PorepStage,
  PorepTotals,
  SnapActorRow,
  SnapSectorView,
  SnapStage,
  SnapTotals,
} from "./types";

// ---------------------------------------------------------------------------
// PoRep sector normalization
// ---------------------------------------------------------------------------

function resolvePorepStage(s: SectorListEntry): PorepStage {
  if (s.Failed) return "Failed";
  if (s.AfterCommitMsgSuccess) return "Done";
  if (s.AfterCommitMsg) return "Commit";
  if (s.AfterPoRep) return "PoRep";
  if (s.AfterPrecommitMsgSuccess) return "WaitSeed";
  if (s.AfterPrecommitMsg) return "PreCommit";
  if (s.AfterTreeR) return "Trees";
  if (s.AfterSDR) return "SDR";
  return "Pending";
}

function resolvePorepRunningStages(s: SectorListEntry): string[] {
  return [
    s.StartedSDR && "SDR",
    s.StartedTreeRC && "TreeRC",
    s.StartedPrecommitMsg && "PreCommit",
    s.StartedPoRep && "PoRep",
    s.StartedCommitMsg && "Commit",
  ].filter(Boolean) as string[];
}

function resolvePorepActiveTaskId(s: SectorListEntry): number | null {
  return (
    s.TaskSDR ??
    s.TaskTreeD ??
    s.TaskTreeC ??
    s.TaskTreeR ??
    s.TaskSynthetic ??
    s.TaskPrecommitMsg ??
    s.TaskPoRep ??
    s.TaskFinalize ??
    s.TaskMoveStorage ??
    s.TaskCommitMsg ??
    null
  );
}

export function normalizePorepSector(s: SectorListEntry): PorepSectorView {
  const stage = resolvePorepStage(s);
  const runningStages = resolvePorepRunningStages(s);
  return {
    spId: s.SpID,
    sectorNumber: s.SectorNumber,
    address: s.Address ?? "",
    createTime: s.CreateTime ?? "",
    stage,
    isRunning:
      runningStages.length > 0 && !s.Failed && !s.AfterCommitMsgSuccess,
    activeTaskId: resolvePorepActiveTaskId(s),
    failed: s.Failed,
    failedReason: s.FailedReason ?? "",
    chainAlloc: s.ChainAlloc,
    chainSector: s.ChainSector,
    chainActive: s.ChainActive,
    chainUnproven: s.ChainUnproven,
    chainFaulty: s.ChainFaulty,
    preCommitMsgCid: s.PreCommitMsgCid ?? null,
    commitMsgCid: s.CommitMsgCid ?? null,
    seedEpoch: s.SeedEpoch ?? null,
    runningStages,
    raw: s,
  };
}

// ---------------------------------------------------------------------------
// PoRep totals & actor rows
// ---------------------------------------------------------------------------

export function computePorepTotals(
  summaries: PorepPipelineSummary[],
): PorepTotals {
  return summaries.reduce(
    (acc, s) => ({
      sdr: acc.sdr + s.CountSDR,
      trees: acc.trees + s.CountTrees,
      precommit: acc.precommit + s.CountPrecommitMsg,
      waitSeed: acc.waitSeed + s.CountWaitSeed,
      porep: acc.porep + s.CountPoRep,
      commit: acc.commit + s.CountCommitMsg,
      done: acc.done + s.CountDone,
      failed: acc.failed + s.CountFailed,
    }),
    {
      sdr: 0,
      trees: 0,
      precommit: 0,
      waitSeed: 0,
      porep: 0,
      commit: 0,
      done: 0,
      failed: 0,
    },
  );
}

export function buildPorepActorRows(
  summaries: PorepPipelineSummary[],
): PorepActorRow[] {
  return summaries.map((s) => ({
    actor: s.Actor,
    countSDR: s.CountSDR,
    countTrees: s.CountTrees,
    countPrecommit: s.CountPrecommitMsg,
    countWaitSeed: s.CountWaitSeed,
    countPoRep: s.CountPoRep,
    countCommit: s.CountCommitMsg,
    countDone: s.CountDone,
    countFailed: s.CountFailed,
  }));
}

// ---------------------------------------------------------------------------
// Snap sector normalization
// ---------------------------------------------------------------------------

function resolveSnapStage(s: SnapSectorEntry): SnapStage {
  if (s.Failed) return "Failed";
  if (s.AfterProveMsgSuccess) return "Done";
  if (s.AfterMoveStorage) return "MoveStorage";
  if (s.AfterSubmit) return "Submit";
  if (s.AfterProve) return "Prove";
  if (s.AfterEncode) return "Encode";
  return "Pending";
}

function resolveSnapActiveTaskId(s: SnapSectorEntry): number | null {
  return (
    s.TaskIDEncode ??
    s.TaskIDProve ??
    s.TaskIDSubmit ??
    s.TaskIDMoveStorage ??
    null
  );
}

export function normalizeSnapSector(s: SnapSectorEntry): SnapSectorView {
  return {
    spId: s.SpID,
    sectorNumber: s.SectorNumber,
    address: s.Address ?? "",
    startTime: s.StartTime ?? "",
    stage: resolveSnapStage(s),
    activeTaskId: resolveSnapActiveTaskId(s),
    failed: s.Failed,
    failedReason: s.FailedReason ?? "",
    failedReasonMsg: s.FailedReasonMsg ?? "",
    updateReadyAt: s.UpdateReadyAt ?? null,
    raw: s,
  };
}

// ---------------------------------------------------------------------------
// Snap totals & actor rows
// ---------------------------------------------------------------------------

export function computeSnapTotals(
  stats: PipelineWaterfallStats | undefined,
  sectors: SnapSectorEntry[],
): SnapTotals {
  const getStageCount = (name: string) => {
    const stage = stats?.Stages.find((s) => s.Name === name);
    return (stage?.Pending ?? 0) + (stage?.Running ?? 0);
  };

  return {
    encode: getStageCount("Encode"),
    prove: getStageCount("Prove"),
    submit: getStageCount("Submit"),
    moveStorage: getStageCount("MoveStorage"),
    done: sectors.filter((s) => s.AfterProveMsgSuccess && !s.Failed).length,
    failed: sectors.filter((s) => s.Failed).length,
  };
}

export function buildSnapActorRows(sectors: SnapSectorEntry[]): SnapActorRow[] {
  const byActor = new Map<string, SnapActorRow>();

  for (const sector of sectors) {
    const actor = sector.Address || "unknown";
    const current = byActor.get(actor) ?? {
      actor,
      countEncode: 0,
      countProve: 0,
      countSubmit: 0,
      countMoveStorage: 0,
      countDone: 0,
      countFailed: 0,
    };

    if (sector.Failed) {
      current.countFailed += 1;
    } else if (sector.AfterProveMsgSuccess) {
      current.countDone += 1;
    } else if (sector.AfterMoveStorage) {
      current.countMoveStorage += 1;
    } else if (sector.AfterSubmit) {
      current.countSubmit += 1;
    } else if (sector.AfterProve) {
      current.countProve += 1;
    } else {
      current.countEncode += 1;
    }

    byActor.set(actor, current);
  }

  return Array.from(byActor.values()).sort((a, b) =>
    a.actor.localeCompare(b.actor),
  );
}
