import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ActorDetail,
  ActorSummaryData,
  SectorBuckets,
} from "@/types/actor";
import type { WinStat } from "@/types/win";
import { useActorDetailBundle } from "./queries";

const { useCurioRpcMock } = vi.hoisted(() => ({
  useCurioRpcMock: vi.fn(),
}));

vi.mock("@/hooks/use-curio-query", () => ({
  useCurioRpc: useCurioRpcMock,
}));

const summary: ActorSummaryData = {
  Address: "f01234",
  CLayers: [],
  QualityAdjustedPower: "0",
  RawBytePower: "0",
  Deadlines: [],
  ActorBalance: "0",
  ActorAvailable: "0",
  VestingFunds: "0",
  InitialPledgeRequirement: "0",
  PreCommitDeposits: "0",
  Win1: 0,
  Win7: 0,
  Win30: 0,
};

const detail: ActorDetail = {
  Summary: summary,
  OwnerAddress: "f01234",
  Beneficiary: "f01234",
  WorkerAddress: "f01234",
  WorkerBalance: "0",
  PeerID: "peer",
  Address: [],
  SectorSize: 34359738368,
  Wallets: [],
};

const charts: SectorBuckets = {
  All: [],
  CC: [],
};

const wins: WinStat[] = [
  {
    Actor: 1234,
    Epoch: 100,
    Block: "bafy2bzacec4verylongblockidentifier0123456789abcdef",
    TaskID: 99,
    SubmittedAt: null,
    Included: true,
    BaseComputeTime: null,
    MinedAt: null,
    SubmittedAtStr: "2026-03-15 09:00",
    TaskSuccess: "ok",
    IncludedStr: "yes",
    ComputeTime: "1s",
    Miner: "f01234",
  },
  {
    Actor: 9999,
    Epoch: 101,
    Block: "bafy2bzaceanotherminer",
    TaskID: 100,
    SubmittedAt: null,
    Included: true,
    BaseComputeTime: null,
    MinedAt: null,
    SubmittedAtStr: "2026-03-15 09:30",
    TaskSuccess: "ok",
    IncludedStr: "yes",
    ComputeTime: "2s",
    Miner: "f09999",
  },
];

describe("useActorDetailBundle", () => {
  beforeEach(() => {
    useCurioRpcMock.mockReset();
  });

  it("stays loading until actor charts finish loading", () => {
    useCurioRpcMock.mockImplementation((method: string) => {
      switch (method) {
        case "ActorInfo":
          return { data: detail, isLoading: false };
        case "ActorCharts":
          return { data: undefined, isLoading: true };
        case "WinStats":
          return { data: wins, isLoading: false };
        default:
          throw new Error(`Unexpected RPC method: ${method}`);
      }
    });

    const { result } = renderHook(() => useActorDetailBundle("f01234"));

    expect(result.current.actorWins).toEqual([wins[0]]);
    expect(result.current.isLoading).toBe(true);
  });

  it("stays loading until win stats finish loading", () => {
    useCurioRpcMock.mockImplementation((method: string) => {
      switch (method) {
        case "ActorInfo":
          return { data: detail, isLoading: false };
        case "ActorCharts":
          return { data: charts, isLoading: false };
        case "WinStats":
          return { data: undefined, isLoading: true };
        default:
          throw new Error(`Unexpected RPC method: ${method}`);
      }
    });

    const { result } = renderHook(() => useActorDetailBundle("f01234"));

    expect(result.current.actorWins).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });
});
