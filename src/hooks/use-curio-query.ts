import {
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCurioApi, useCurioConnection } from "@/contexts/curio-api-context";
import type { CurioApiService } from "@/services/curio-api";

const DEFAULT_POLL_INTERVAL = 30_000;

/**
 * Hook for JSON-RPC calls via TanStack Query with automatic polling.
 */
export function useCurioRpc<T>(
  method: string,
  params: unknown[] = [],
  options?: {
    refetchInterval?: number | false;
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  return useQuery({
    queryKey: ["curio", method, endpoint, ...params],
    queryFn: () => api.call<T>(method, params),
    refetchInterval: options?.refetchInterval ?? DEFAULT_POLL_INTERVAL,
    enabled: options?.enabled,
    staleTime: options?.staleTime,
  });
}

/**
 * Hook for REST GET calls via TanStack Query.
 */
export function useCurioRest<T>(
  path: string,
  options?: {
    refetchInterval?: number | false;
    enabled?: boolean;
    staleTime?: number;
    queryKey?: unknown[];
  },
) {
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();

  return useQuery({
    queryKey:
      options?.queryKey !== undefined
        ? ["curio-rest", ...options.queryKey, endpoint]
        : ["curio-rest", path, endpoint],
    queryFn: ({ signal }) => api.restGet<T>(path, { signal }),
    refetchInterval: options?.refetchInterval ?? DEFAULT_POLL_INTERVAL,
    enabled: options?.enabled,
    staleTime: options?.staleTime,
  });
}

/**
 * Hook for REST POST mutations.
 */
export function useCurioMutation<TData = unknown, TVariables = unknown>(
  path: string,
  options?: {
    invalidateKeys?: unknown[][];
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  },
) {
  const api = useCurioApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) => api.restPost<TData>(path, variables),
    onSuccess: (data) => {
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Hook for JSON-RPC mutations via TanStack Query.
 */
export function useCurioRpcMutation<TData = unknown>(
  method: string,
  options?: {
    invalidateKeys?: unknown[][];
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  },
) {
  const api = useCurioApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: unknown[]) => api.call<TData>(method, params),
    onSuccess: (data) => {
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Helper to create typed query options for use with prefetching.
 */
export function curioQueryOptions<T>(
  api: CurioApiService,
  method: string,
  endpoint: string,
  params: unknown[] = [],
): UseQueryOptions<T> {
  return {
    queryKey: ["curio", method, endpoint, ...params],
    queryFn: () => api.call<T>(method, params),
    staleTime: 10_000,
  };
}
