import { renderHook } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardSummary } from "./use-dashboard-summary";

const { queryClientRefetchQueriesMock, useCurioRpcMock } = vi.hoisted(() => ({
  queryClientRefetchQueriesMock: vi.fn(),
  useCurioRpcMock: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    refetchQueries: queryClientRefetchQueriesMock,
  }),
}));

vi.mock("@/hooks/use-curio-query", () => ({
  useCurioRpc: useCurioRpcMock,
}));

describe("useDashboardSummary", () => {
  beforeEach(() => {
    queryClientRefetchQueriesMock.mockReset();
    queryClientRefetchQueriesMock.mockResolvedValue(undefined);
    useCurioRpcMock.mockReset();
    useCurioRpcMock.mockImplementation((method: string) => ({
      data: method === "WalletNames" ? {} : [],
      isLoading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    }));
  });

  it("refreshes wallet detail queries alongside wallet names", async () => {
    const { result } = renderHook(() => useDashboardSummary());

    await act(async () => {
      await result.current.refresh();
    });

    expect(queryClientRefetchQueriesMock).toHaveBeenCalledWith({
      queryKey: ["curio", "WalletInfoShort"],
      type: "active",
    });
  });

  it("derives dashboard metrics from source query data", () => {
    const dataByMethod: Record<string, unknown> = {
      ActorSummary: [
        {
          QualityAdjustedPower: "1024",
          RawBytePower: "2048",
          Win1: 1,
          Win7: 2,
          Win30: 3,
        },
      ],
      AlertPendingCount: 4,
      ClusterMachines: [
        { RunningTasks: 2, Unschedulable: false },
        { RunningTasks: 5, Unschedulable: true },
      ],
      ClusterTaskHistory: [],
      ClusterTaskSummary: [],
      HarmonyTaskStats: [
        { TotalCount: 5, TrueCount: 3 },
        { TotalCount: 10, TrueCount: 7 },
      ],
      PipelineStatsSDR: {
        Stages: [{ Name: "Failed", Pending: 2, Running: 0 }],
        Total: 6,
      },
      PipelineStatsSnap: {
        Stages: [{ Name: "Failed", Pending: 1, Running: 0 }],
        Total: 4,
      },
      StorageUseStats: [
        { Available: 20, Capacity: 100 },
        { Available: 100, Capacity: 200 },
      ],
      SyncerState: [{ Reachable: false }, { Reachable: true }],
      WalletNames: {},
    };

    useCurioRpcMock.mockImplementation((method: string) => ({
      data: dataByMethod[method] ?? [],
      error: null,
      isLoading: false,
      refetch: vi.fn().mockResolvedValue(undefined),
    }));

    const { result } = renderHook(() => useDashboardSummary());

    expect(result.current.metrics).toMatchObject({
      actorCount: 1,
      alertPending: 4,
      machineHealth: 50,
      machinesOnline: 1,
      machinesTotal: 2,
      pipelineActive: 10,
      pipelineFailed: 3,
      runningTasks: 7,
      storageAvailableLabel: "120 B",
      storageCapacityLabel: "300 B",
      storageUsagePercent: 60,
      storageUsedLabel: "180 B",
      taskSuccessRate: (10 / 15) * 100,
      wins1d: 1,
      wins7d: 2,
      wins30d: 3,
    });
    expect(result.current.endpointIssues).toBe(1);
  });
});
