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
});
