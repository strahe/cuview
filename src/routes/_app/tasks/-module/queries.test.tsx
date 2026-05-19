import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as queries from "./queries";
import { taskQueryKeys } from "./query-keys";

const { mutationResult, useCurioRpcMock, useCurioRpcMutationMock } = vi.hoisted(
  () => {
    const mutationResult = {
      isPending: false,
      mutate: vi.fn(),
      reset: vi.fn(),
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

describe("task queries", () => {
  beforeEach(() => {
    mutationResult.mutate.mockReset();
    mutationResult.reset.mockReset();
    useCurioRpcMock.mockReset();
    useCurioRpcMutationMock.mockReset();
    useCurioRpcMutationMock.mockReturnValue(mutationResult);
  });

  it("guards singleton info behind Curio v1.27.4", () => {
    useCurioRpcMock.mockImplementation((method: string) => ({
      data: method === "Version" ? "v1.27.3" : undefined,
      isLoading: false,
      error: null,
    }));

    renderHook(() => queries.useSingletonTaskInfo("WindowPost"));

    expect(useCurioRpcMock).toHaveBeenCalledWith(
      "SingletonTaskInfo",
      ["WindowPost"],
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it("normalizes singleton info query results on supported nodes", () => {
    useCurioRpcMock.mockImplementation(
      (
        method: string,
        _params: unknown[],
        options?: { select?: (data: unknown) => unknown },
      ) => {
        if (method === "Version") {
          return { data: "v1.27.4+calibnet", isLoading: false, error: null };
        }

        if (method === "SingletonTaskInfo") {
          const raw = {
            TaskName: "WindowPost",
            TaskID: 0,
            LastRunTime: "2026-04-28T08:00:00Z",
            RunNowRequest: false,
          };
          return {
            data: options?.select ? options.select(raw) : raw,
            isLoading: false,
            error: null,
          };
        }

        return { data: undefined, isLoading: false, error: null };
      },
    );

    const { result } = renderHook(() =>
      queries.useSingletonTaskInfo("WindowPost"),
    );

    expect(useCurioRpcMock).toHaveBeenCalledWith(
      "SingletonTaskInfo",
      ["WindowPost"],
      expect.objectContaining({
        enabled: true,
        refetchInterval: 5_000,
      }),
    );
    expect(result.current.data).toEqual({
      taskName: "WindowPost",
      taskId: null,
      lastRunTime: "2026-04-28T08:00:00Z",
      runNowRequest: false,
    });
  });

  it("invalidates singleton task state after run-now requests", () => {
    renderHook(() => queries.useSingletonRunNow());

    expect(useCurioRpcMutationMock).toHaveBeenCalledWith(
      "SingletonRunNow",
      expect.objectContaining({
        invalidateKeys: expect.arrayContaining([
          taskQueryKeys.summary,
          taskQueryKeys.typeHistory,
          taskQueryKeys.singletonInfo,
        ]),
      }),
    );
  });
});
