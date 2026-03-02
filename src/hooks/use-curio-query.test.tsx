import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCurioRest, useCurioRpc } from "@/hooks/use-curio-query";

const { mockState } = vi.hoisted(() => {
  const call = vi.fn();
  const restGet = vi.fn();
  const restPost = vi.fn();

  return {
    mockState: {
      endpoint: "ws://localhost:4701/api/webrpc/v0",
      api: {
        call,
        restGet,
        restPost,
      },
    },
  };
});

vi.mock("@/contexts/curio-api-context", () => ({
  useCurioApi: () => mockState.api,
  useCurioConnection: () => ({
    endpoint: mockState.endpoint,
    endpointHistory: [],
    reconnectAttempt: 0,
    status: "connected",
    api: mockState.api,
    testAndSwitchEndpoint: vi.fn(),
  }),
}));

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("useCurioQuery endpoint-scoped cache keys", () => {
  beforeEach(() => {
    mockState.endpoint = "ws://localhost:4701/api/webrpc/v0";
    mockState.api.call.mockReset();
    mockState.api.restGet.mockReset();
    mockState.api.restPost.mockReset();
  });

  it("scopes rpc query cache by endpoint", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockState.api.call.mockResolvedValueOnce("v1");

    const { result, rerender } = renderHook(
      () => useCurioRpc<string>("Version", [], { refetchInterval: false }),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => {
      expect(result.current.data).toBe("v1");
    });

    expect(
      queryClient.getQueryData([
        "curio",
        "Version",
        "ws://localhost:4701/api/webrpc/v0",
      ]),
    ).toBe("v1");

    mockState.endpoint = "ws://192.168.1.230:4701/api/webrpc/v0";
    mockState.api.call.mockResolvedValueOnce("v2");

    rerender();

    await waitFor(() => {
      expect(result.current.data).toBe("v2");
    });

    expect(
      queryClient.getQueryData([
        "curio",
        "Version",
        "ws://192.168.1.230:4701/api/webrpc/v0",
      ]),
    ).toBe("v2");
  });

  it("appends endpoint to custom rest query key", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockState.api.restGet.mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(
      () =>
        useCurioRest<{ ok: boolean }>("/health", {
          queryKey: ["health-check"],
          refetchInterval: false,
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual({ ok: true });
    });

    expect(
      queryClient.getQueryData([
        "curio-rest",
        "health-check",
        "ws://localhost:4701/api/webrpc/v0",
      ]),
    ).toEqual({ ok: true });
  });
});
