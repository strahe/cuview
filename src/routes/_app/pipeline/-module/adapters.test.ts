import { describe, expect, it } from "vitest";
import type {
  PipelineWaterfallStats,
  PorepPipelineSummary,
  SectorListEntry,
  SnapSectorEntry,
} from "@/types/pipeline";
import {
  buildPorepActorRows,
  buildSnapActorRows,
  computePorepTotals,
  computeSnapTotals,
  normalizePorepSector,
  normalizeSnapSector,
} from "./adapters";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makePorepSector(
  overrides: Partial<SectorListEntry> = {},
): SectorListEntry {
  return {
    SpID: 1234,
    SectorNumber: 42,
    CreateTime: "2025-01-01T00:00:00Z",
    AfterSDR: false,
    AfterTreeD: false,
    AfterTreeC: false,
    AfterTreeR: false,
    AfterSynthetic: false,
    AfterPrecommitMsg: false,
    AfterPrecommitMsgSuccess: false,
    AfterPoRep: false,
    AfterFinalize: false,
    AfterMoveStorage: false,
    AfterCommitMsg: false,
    AfterCommitMsgSuccess: false,
    StartedSDR: false,
    StartedTreeD: false,
    StartedTreeRC: false,
    StartedSynthetic: false,
    StartedPrecommitMsg: false,
    StartedPoRep: false,
    StartedFinalize: false,
    StartedMoveStorage: false,
    StartedCommitMsg: false,
    Failed: false,
    FailedReason: "",
    MissingTasks: [],
    AllTasks: [],
    Address: "f01234",
    AfterSeed: false,
    ChainAlloc: false,
    ChainSector: false,
    ChainActive: false,
    ChainUnproven: false,
    ChainFaulty: false,
    ...overrides,
  };
}

function makeSnapSector(
  overrides: Partial<SnapSectorEntry> = {},
): SnapSectorEntry {
  return {
    SpID: 5678,
    SectorNumber: 99,
    StartTime: "2025-06-01T00:00:00Z",
    UpgradeProof: 0,
    DataAssigned: false,
    AfterEncode: false,
    AfterProve: false,
    AfterSubmit: false,
    AfterMoveStorage: false,
    AfterProveMsgSuccess: false,
    Failed: false,
    FailedReason: "",
    FailedReasonMsg: "",
    Address: "f05678",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// normalizePorepSector
// ---------------------------------------------------------------------------

describe("normalizePorepSector", () => {
  it("returns Pending stage for a fresh sector", () => {
    const result = normalizePorepSector(makePorepSector());
    expect(result.stage).toBe("Pending");
    expect(result.isRunning).toBe(false);
    expect(result.activeTaskId).toBeNull();
    expect(result.spId).toBe(1234);
    expect(result.sectorNumber).toBe(42);
    expect(result.address).toBe("f01234");
  });

  it("resolves SDR stage when AfterSDR is true", () => {
    const result = normalizePorepSector(makePorepSector({ AfterSDR: true }));
    expect(result.stage).toBe("SDR");
  });

  it("resolves Done stage", () => {
    const result = normalizePorepSector(
      makePorepSector({ AfterCommitMsgSuccess: true }),
    );
    expect(result.stage).toBe("Done");
    expect(result.isRunning).toBe(false);
  });

  it("resolves Failed stage", () => {
    const result = normalizePorepSector(
      makePorepSector({ Failed: true, FailedReason: "disk full" }),
    );
    expect(result.stage).toBe("Failed");
    expect(result.failed).toBe(true);
    expect(result.failedReason).toBe("disk full");
  });

  it("detects running state from StartedSDR", () => {
    const result = normalizePorepSector(makePorepSector({ StartedSDR: true }));
    expect(result.isRunning).toBe(true);
    expect(result.runningStages).toContain("SDR");
  });

  it("not running if failed even with started flags", () => {
    const result = normalizePorepSector(
      makePorepSector({ Failed: true, StartedSDR: true }),
    );
    expect(result.isRunning).toBe(false);
  });

  it("picks up activeTaskId from TaskSDR", () => {
    const result = normalizePorepSector(makePorepSector({ TaskSDR: 100 }));
    expect(result.activeTaskId).toBe(100);
  });

  it("preserves raw reference", () => {
    const raw = makePorepSector();
    const result = normalizePorepSector(raw);
    expect(result.raw).toBe(raw);
  });

  it("handles nullable Address gracefully", () => {
    const result = normalizePorepSector(
      makePorepSector({ Address: undefined as unknown as string }),
    );
    expect(result.address).toBe("");
  });
});

// ---------------------------------------------------------------------------
// normalizeSnapSector
// ---------------------------------------------------------------------------

describe("normalizeSnapSector", () => {
  it("returns Pending stage for a fresh sector", () => {
    const result = normalizeSnapSector(makeSnapSector());
    expect(result.stage).toBe("Pending");
    expect(result.spId).toBe(5678);
  });

  it("resolves Encode stage", () => {
    const result = normalizeSnapSector(makeSnapSector({ AfterEncode: true }));
    expect(result.stage).toBe("Encode");
  });

  it("resolves Done stage", () => {
    const result = normalizeSnapSector(
      makeSnapSector({ AfterProveMsgSuccess: true }),
    );
    expect(result.stage).toBe("Done");
  });

  it("resolves Failed stage", () => {
    const result = normalizeSnapSector(
      makeSnapSector({
        Failed: true,
        FailedReason: "proof invalid",
        FailedReasonMsg: "bad data",
      }),
    );
    expect(result.stage).toBe("Failed");
    expect(result.failedReason).toBe("proof invalid");
    expect(result.failedReasonMsg).toBe("bad data");
  });

  it("picks up activeTaskId", () => {
    const result = normalizeSnapSector(makeSnapSector({ TaskIDProve: 55 }));
    expect(result.activeTaskId).toBe(55);
  });

  it("preserves raw reference", () => {
    const raw = makeSnapSector();
    const result = normalizeSnapSector(raw);
    expect(result.raw).toBe(raw);
  });
});

// ---------------------------------------------------------------------------
// computePorepTotals
// ---------------------------------------------------------------------------

describe("computePorepTotals", () => {
  it("sums counts from multiple summaries", () => {
    const summaries: PorepPipelineSummary[] = [
      {
        Actor: "f01",
        CountSDR: 2,
        CountTrees: 1,
        CountPrecommitMsg: 0,
        CountWaitSeed: 0,
        CountPoRep: 0,
        CountCommitMsg: 0,
        CountDone: 5,
        CountFailed: 1,
      },
      {
        Actor: "f02",
        CountSDR: 3,
        CountTrees: 0,
        CountPrecommitMsg: 1,
        CountWaitSeed: 2,
        CountPoRep: 0,
        CountCommitMsg: 1,
        CountDone: 10,
        CountFailed: 0,
      },
    ];
    const totals = computePorepTotals(summaries);
    expect(totals.sdr).toBe(5);
    expect(totals.trees).toBe(1);
    expect(totals.precommit).toBe(1);
    expect(totals.waitSeed).toBe(2);
    expect(totals.done).toBe(15);
    expect(totals.failed).toBe(1);
  });

  it("returns zeros for empty array", () => {
    const totals = computePorepTotals([]);
    expect(totals.sdr).toBe(0);
    expect(totals.done).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeSnapTotals
// ---------------------------------------------------------------------------

describe("computeSnapTotals", () => {
  it("counts from stats stages and sector state", () => {
    const stats: PipelineWaterfallStats = {
      Total: 10,
      Stages: [
        { Name: "Encode", Pending: 2, Running: 1 },
        { Name: "Prove", Pending: 0, Running: 3 },
        { Name: "Submit", Pending: 1, Running: 0 },
        { Name: "MoveStorage", Pending: 0, Running: 0 },
      ],
    };
    const sectors: SnapSectorEntry[] = [
      makeSnapSector({ AfterProveMsgSuccess: true }),
      makeSnapSector({ AfterProveMsgSuccess: true }),
      makeSnapSector({ Failed: true }),
    ];
    const totals = computeSnapTotals(stats, sectors);
    expect(totals.encode).toBe(3);
    expect(totals.prove).toBe(3);
    expect(totals.submit).toBe(1);
    expect(totals.moveStorage).toBe(0);
    expect(totals.done).toBe(2);
    expect(totals.failed).toBe(1);
  });

  it("handles undefined stats gracefully", () => {
    const totals = computeSnapTotals(undefined, []);
    expect(totals.encode).toBe(0);
    expect(totals.done).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildPorepActorRows
// ---------------------------------------------------------------------------

describe("buildPorepActorRows", () => {
  it("maps each summary to an actor row", () => {
    const summaries: PorepPipelineSummary[] = [
      {
        Actor: "f01234",
        CountSDR: 1,
        CountTrees: 2,
        CountPrecommitMsg: 0,
        CountWaitSeed: 0,
        CountPoRep: 0,
        CountCommitMsg: 0,
        CountDone: 0,
        CountFailed: 0,
      },
    ];
    const rows = buildPorepActorRows(summaries);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.actor).toBe("f01234");
    expect(rows[0]!.countSDR).toBe(1);
    expect(rows[0]!.countTrees).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// buildSnapActorRows
// ---------------------------------------------------------------------------

describe("buildSnapActorRows", () => {
  it("groups sectors by actor and tallies stages", () => {
    const sectors: SnapSectorEntry[] = [
      makeSnapSector({ Address: "f01", AfterEncode: true }),
      makeSnapSector({ Address: "f01", Failed: true }),
      makeSnapSector({ Address: "f02", AfterProveMsgSuccess: true }),
    ];
    const rows = buildSnapActorRows(sectors);
    expect(rows).toHaveLength(2);

    const f01 = rows.find((r) => r.actor === "f01")!;
    expect(f01.countEncode).toBe(1);
    expect(f01.countFailed).toBe(1);

    const f02 = rows.find((r) => r.actor === "f02")!;
    expect(f02.countDone).toBe(1);
  });

  it("sorts by actor name", () => {
    const sectors: SnapSectorEntry[] = [
      makeSnapSector({ Address: "f09" }),
      makeSnapSector({ Address: "f01" }),
    ];
    const rows = buildSnapActorRows(sectors);
    expect(rows[0]!.actor).toBe("f01");
    expect(rows[1]!.actor).toBe("f09");
  });

  it("returns empty array for empty input", () => {
    expect(buildSnapActorRows([])).toEqual([]);
  });
});
