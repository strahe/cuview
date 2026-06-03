import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as queries from "./queries";

const { useCurioRpcMock, useCurioRpcMutationMock } = vi.hoisted(() => ({
  useCurioRpcMock: vi.fn(),
  useCurioRpcMutationMock: vi.fn(),
}));

vi.mock("@/hooks/use-curio-query", () => ({
  useCurioRpc: useCurioRpcMock,
  useCurioRpcMutation: useCurioRpcMutationMock,
}));

describe("market queries", () => {
  beforeEach(() => {
    useCurioRpcMock.mockReset();
    useCurioRpcMutationMock.mockReset();
  });

  it("passes v1.28.1 pagination params to MK12 pipeline lookup", () => {
    useCurioRpcMock.mockReturnValue({ data: [] });

    renderHook(() => queries.useMK12Pipelines());

    expect(useCurioRpcMock).toHaveBeenCalledWith(
      "GetMK12DealPipelines",
      [100, 0],
      expect.objectContaining({ refetchInterval: 30_000 }),
    );
  });

  it("keeps PieceDealDetail as the v1.28.1 nested mk12/mk20 response", () => {
    const response = {
      mk12: [
        {
          deal: {
            uuid: "deal-1",
            piece_cid: "baga-piece",
            sp_id: 1000,
            start_epoch: 10,
            end_epoch: 20,
            piece_size: 2048,
          },
          mk12_pipeline: { uuid: "pipeline-1" },
        },
      ],
      mk20: [{ deal: { ddoerr: null }, mk20_ddo_pipeline: { id: "mk20-1" } }],
    };
    useCurioRpcMock.mockReturnValue({ data: response });

    const { result } = renderHook(() =>
      queries.usePieceDealDetail("baga-piece", true),
    );

    expect(useCurioRpcMock).toHaveBeenCalledWith(
      "PieceDealDetail",
      ["baga-piece"],
      expect.objectContaining({ enabled: true }),
    );
    expect(result.current.data).toBe(response);
  });

  it("keeps PieceParkStates as a single park state object", () => {
    const response = {
      id: 7,
      piece_cid: "baga-piece",
      piece_padded_size: 2048,
      piece_raw_size: 1016,
      complete: true,
      created_at: "2026-06-03T00:00:00Z",
      task_id: null,
      cleanup_task_id: null,
      refs: [],
    };
    useCurioRpcMock.mockReturnValue({ data: response });

    const { result } = renderHook(() =>
      queries.usePieceParkStates("baga-piece", true),
    );

    expect(useCurioRpcMock).toHaveBeenCalledWith(
      "PieceParkStates",
      ["baga-piece"],
      expect.objectContaining({ enabled: true }),
    );
    expect(result.current.data).toBe(response);
  });

  it("normalizes FindContentByCID v1.28.1 rows for content search display", () => {
    expect(
      queries.normalizeContentInfoResults([
        { piece_cid: "baga-piece", offset: 128, size: 256, err: "missing" },
      ]),
    ).toEqual([
      {
        pieceCid: "baga-piece",
        details: ["Offset: 128", "Size: 256"],
        error: "missing",
      },
    ]);
  });

  it("normalizes FindEntriesByDataURL v1.28.1 rows for content search display", () => {
    expect(
      queries.normalizePieceParkRefResults([
        {
          table_name: "market_mk12_deal_pipeline",
          sp_id: 1000,
          sector_number: 42,
          piece_index: 3,
          piece_cid: "baga-piece",
          deal_uuid: "deal-1",
          addr: "f01000",
        },
      ]),
    ).toEqual([
      {
        pieceCid: "baga-piece",
        details: [
          "Source: market_mk12_deal_pipeline",
          "SP: f01000",
          "Sector: 42",
          "Piece index: 3",
          "Deal: deal-1",
        ],
      },
    ]);
  });
});
