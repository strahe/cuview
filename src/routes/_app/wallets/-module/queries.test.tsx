import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as queries from "./queries";

const {
  mutationResult,
  queryClientInvalidateMock,
  useCurioApiMock,
  useCurioConnectionMock,
  useCurioRpcMock,
  useCurioRpcMutationMock,
  useQueriesMock,
} = vi.hoisted(() => {
  const mutationResult = {
    isPending: false,
    mutate: vi.fn(),
    reset: vi.fn(),
  };

  return {
    mutationResult,
    queryClientInvalidateMock: vi.fn(),
    useCurioApiMock: vi.fn(),
    useCurioConnectionMock: vi.fn(),
    useCurioRpcMock: vi.fn(),
    useCurioRpcMutationMock: vi.fn(() => mutationResult),
    useQueriesMock: vi.fn(),
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );

  return {
    ...actual,
    useQueries: useQueriesMock,
    useQueryClient: () => ({
      invalidateQueries: queryClientInvalidateMock,
    }),
  };
});

vi.mock("@/contexts/curio-api-context", () => ({
  useCurioApi: useCurioApiMock,
  useCurioConnection: useCurioConnectionMock,
}));

vi.mock("@/hooks/use-curio-query", () => ({
  useCurioRpc: useCurioRpcMock,
  useCurioRpcMutation: useCurioRpcMutationMock,
}));

describe("wallet queries", () => {
  beforeEach(() => {
    mutationResult.mutate.mockReset();
    mutationResult.reset.mockReset();
    queryClientInvalidateMock.mockReset();
    useCurioApiMock.mockReset();
    useCurioConnectionMock.mockReset();
    useCurioRpcMock.mockReset();
    useCurioRpcMutationMock.mockReset();
    useCurioRpcMutationMock.mockReturnValue(mutationResult);
    useQueriesMock.mockReset();
  });

  it("keeps wallet list loading until wallet detail queries settle", () => {
    useCurioRpcMock.mockReturnValue({
      data: { f1alpha: "Alpha Wallet" },
      isLoading: false,
      isError: false,
      error: null,
    });
    useCurioApiMock.mockReturnValue({ call: vi.fn() });
    useCurioConnectionMock.mockReturnValue({ endpoint: "wss://curio.example" });
    useQueriesMock.mockReturnValue({
      results: [
        {
          data: undefined,
          isLoading: true,
          isError: false,
        },
      ],
      isLoading: true,
    });

    const { result } = renderHook(() => queries.useWalletList());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([
      {
        address: "f1alpha",
        name: "Alpha Wallet",
        idAddress: null,
        keyAddress: null,
        balance: null,
        pendingMessages: null,
        isLoadingBalance: true,
        balanceError: false,
      },
    ]);
  });

  it("invalidates wallet detail queries after adding a wallet", () => {
    renderHook(() => queries.useAddWallet());

    expect(useCurioRpcMutationMock).toHaveBeenCalledWith(
      "WalletAdd",
      expect.objectContaining({
        invalidateKeys: expect.arrayContaining([
          ["curio", "WalletNames"],
          ["curio", "WalletInfoShort"],
        ]),
      }),
    );
  });

  it("invalidates wallet detail queries after removing a wallet", () => {
    renderHook(() => queries.useRemoveWallet());

    expect(useCurioRpcMutationMock).toHaveBeenCalledWith(
      "WalletRemove",
      expect.objectContaining({
        invalidateKeys: expect.arrayContaining([
          ["curio", "WalletNames"],
          ["curio", "WalletInfoShort"],
        ]),
      }),
    );
  });

  it("invalidates wallet detail queries after renaming a wallet", () => {
    renderHook(() => queries.useRenameWallet());

    expect(useCurioRpcMutationMock).toHaveBeenCalledWith(
      "WalletNameChange",
      expect.objectContaining({
        invalidateKeys: expect.arrayContaining([
          ["curio", "WalletNames"],
          ["curio", "WalletInfoShort"],
        ]),
      }),
    );
  });
});
