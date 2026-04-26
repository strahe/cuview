import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  PipelineWaterfallStats,
  SectorListEntry,
  SnapSectorEntry,
} from "@/types/pipeline";
import { normalizePorepSector, normalizeSnapSector } from "./adapters";
import * as queries from "./queries";
import { snapInvalidateKeys } from "./query-keys";

const { mutationResult, useCurioRpcMock, useCurioRpcMutationMock } = vi.hoisted(
  () => {
    const mutationResult = {
      isPending: false,
      mutate: vi.fn(),
    };

    return {
      mutationResult,
      useCurioRpcMock: vi.fn(),
      useCurioRpcMutationMock: vi.fn(() => mutationResult),
    };
  },
);

vi.mock("@/hooks/use-curio-query", () => ({
  useCurioRpc: useCurioRpcMock,
  useCurioRpcMutation: useCurioRpcMutationMock,
}));

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

function makePorepSector(
  overrides: Partial<SectorListEntry> = {},
): SectorListEntry {
  return {
    Address: "f01234",
    AfterCommitMsg: false,
    AfterCommitMsgSuccess: false,
    AfterFinalize: false,
    AfterMoveStorage: false,
    AfterPoRep: false,
    AfterPrecommitMsg: false,
    AfterPrecommitMsgSuccess: false,
    AfterSDR: false,
    AfterSeed: false,
    AfterSynthetic: false,
    AfterTreeC: false,
    AfterTreeD: false,
    AfterTreeR: false,
    AllTasks: [],
    ChainActive: false,
    ChainAlloc: false,
    ChainFaulty: false,
    ChainSector: false,
    ChainUnproven: false,
    CreateTime: "2025-06-01T00:00:00Z",
    Failed: false,
    FailedReason: "",
    MissingTasks: [],
    SectorNumber: 42,
    SpID: 1234,
    StartedCommitMsg: false,
    StartedFinalize: false,
    StartedMoveStorage: false,
    StartedPoRep: false,
    StartedPrecommitMsg: false,
    StartedSDR: false,
    StartedSynthetic: false,
    StartedTreeD: false,
    StartedTreeRC: false,
    ...overrides,
  };
}

describe("snap pipeline query helpers", () => {
  beforeEach(() => {
    mutationResult.mutate.mockReset();
    useCurioRpcMock.mockReset();
    useCurioRpcMutationMock.mockReset();
    useCurioRpcMutationMock.mockReturnValue(mutationResult);
  });

  it("exposes a summary hook that derives totals and actor rows from normalized sectors", () => {
    const useSnapSummary =
      "useSnapSummary" in queries ? queries.useSnapSummary : undefined;

    expect(useSnapSummary).toBeDefined();

    if (!useSnapSummary) {
      return;
    }

    const stats: PipelineWaterfallStats = {
      Total: 10,
      Stages: [
        { Name: "Encode", Pending: 2, Running: 1 },
        { Name: "Prove", Pending: 0, Running: 2 },
        { Name: "Submit", Pending: 1, Running: 0 },
        { Name: "MoveStorage", Pending: 0, Running: 0 },
      ],
    };

    const sectors = [
      normalizeSnapSector(
        makeSnapSector({ Address: "f01", AfterEncode: true }),
      ),
      normalizeSnapSector(
        makeSnapSector({
          Address: "f01",
          Failed: true,
          FailedReason: "disk full",
        }),
      ),
      normalizeSnapSector(
        makeSnapSector({ Address: "f02", AfterProveMsgSuccess: true }),
      ),
    ];

    const { result } = renderHook(() => useSnapSummary(stats, sectors));

    expect(result.current.totals).toEqual({
      encode: 3,
      prove: 2,
      submit: 1,
      moveStorage: 0,
      done: 1,
      failed: 1,
    });
    expect(result.current.actorRows).toEqual([
      {
        actor: "f01",
        countEncode: 1,
        countProve: 0,
        countSubmit: 0,
        countMoveStorage: 0,
        countDone: 0,
        countFailed: 1,
      },
      {
        actor: "f02",
        countEncode: 0,
        countProve: 0,
        countSubmit: 0,
        countMoveStorage: 0,
        countDone: 1,
        countFailed: 0,
      },
    ]);
  });

  it("normalizes PoRep sectors through a stable query selector", () => {
    useCurioRpcMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { result, rerender } = renderHook(() => queries.usePorepSectors());
    const firstEmpty = result.current.data;
    const options = useCurioRpcMock.mock.calls[0]?.[2] as {
      select?: (data: SectorListEntry[]) => unknown;
    };
    const raw = [makePorepSector({ AfterSDR: true })];

    expect(useCurioRpcMock).toHaveBeenCalledWith(
      "PipelinePorepSectors",
      [],
      expect.objectContaining({ refetchInterval: 30_000 }),
    );
    expect(options.select).toBeInstanceOf(Function);
    expect(options.select?.(raw)).toEqual(raw.map(normalizePorepSector));

    rerender();
    expect(result.current.data).toBe(firstEmpty);
  });

  it("normalizes Snap sectors through a stable query selector", () => {
    useCurioRpcMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { result, rerender } = renderHook(() => queries.useSnapSectors());
    const firstEmpty = result.current.data;
    const options = useCurioRpcMock.mock.calls[0]?.[2] as {
      select?: (data: SnapSectorEntry[]) => unknown;
    };
    const raw = [makeSnapSector({ AfterEncode: true })];

    expect(useCurioRpcMock).toHaveBeenCalledWith(
      "UpgradeSectors",
      [],
      expect.objectContaining({ refetchInterval: 30_000 }),
    );
    expect(options.select).toBeInstanceOf(Function);
    expect(options.select?.(raw)).toEqual(raw.map(normalizeSnapSector));

    rerender();
    expect(result.current.data).toBe(firstEmpty);
  });

  it("invalidates snap sectors and stats after deleting an upgrade", () => {
    const { result } = renderHook(() => queries.useSnapDelete());

    expect(result.current).toBe(mutationResult);
    expect(useCurioRpcMutationMock).toHaveBeenCalledWith("UpgradeDelete", {
      invalidateKeys: snapInvalidateKeys,
    });
  });

  it("invalidates snap sectors and stats after resetting task ids", () => {
    const { result } = renderHook(() => queries.useSnapResetTasks());

    expect(result.current).toBe(mutationResult);
    expect(useCurioRpcMutationMock).toHaveBeenCalledWith(
      "UpgradeResetTaskIDs",
      {
        invalidateKeys: snapInvalidateKeys,
      },
    );
  });
});
