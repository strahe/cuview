import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";
import { RestClientError } from "@/lib/rest-client";
import { CurioRestAccessError } from "@/utils/curio-rest-access";
import { useCurioRestAccessError } from "./use-curio-rest-access-error";

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe("useCurioRestAccessError", () => {
  it("detects Curio REST query access errors", async () => {
    const queryClient = createQueryClient();
    const endpoint = "ws://localhost:4701/api/webrpc/v0";

    const { result } = renderHook(
      () => {
        useQuery({
          queryKey: ["curio-rest", "/api/config/layers", endpoint],
          queryFn: async () => {
            throw new CurioRestAccessError(new TypeError("Failed to fetch"));
          },
        });

        return useCurioRestAccessError(endpoint);
      },
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("ignores Curio REST HTTP response errors", async () => {
    const queryClient = createQueryClient();
    const endpoint = "ws://localhost:4701/api/webrpc/v0";

    const { result } = renderHook(
      () => {
        const query = useQuery({
          queryKey: ["curio-rest", "/api/config/layers", endpoint],
          queryFn: async () => {
            throw new RestClientError("Request failed", 403, "Forbidden");
          },
        });

        return {
          hasAccessError: useCurioRestAccessError(endpoint),
          status: query.status,
        };
      },
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.hasAccessError).toBe(false);
  });

  it("ignores REST access errors from previous endpoints", async () => {
    const queryClient = createQueryClient();
    const previousEndpoint = "ws://old-curio.local/api/webrpc/v0";
    const currentEndpoint = "ws://localhost:4701/api/webrpc/v0";

    const { result } = renderHook(
      () => {
        const previousQuery = useQuery({
          queryKey: ["curio-rest", "/api/config/layers", previousEndpoint],
          queryFn: async () => {
            throw new CurioRestAccessError(new TypeError("Failed to fetch"));
          },
        });
        const currentQuery = useQuery({
          queryKey: ["curio-rest", "/api/config/layers", currentEndpoint],
          queryFn: async () => ["base"],
        });

        return {
          currentStatus: currentQuery.status,
          hasAccessError: useCurioRestAccessError(currentEndpoint),
          previousStatus: previousQuery.status,
        };
      },
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.previousStatus).toBe("error");
      expect(result.current.currentStatus).toBe("success");
    });

    expect(result.current.hasAccessError).toBe(false);
  });
});
