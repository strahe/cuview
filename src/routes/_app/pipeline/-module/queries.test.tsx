import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PipelineWaterfallStats, SnapSectorEntry } from "@/types/pipeline";
import { normalizeSnapSector } from "./adapters";
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
