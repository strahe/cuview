import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import { isCurioRestAccessError } from "@/utils/curio-rest-access";

const curioRestKey = ["curio-rest"] as const;

function hasCurioRestQueryAccessError(
  queryClient: QueryClient,
  endpoint: string,
): boolean {
  return queryClient
    .getQueryCache()
    .findAll({ queryKey: curioRestKey, type: "active" })
    .some(
      (query) =>
        query.queryKey.at(-1) === endpoint &&
        isCurioRestAccessError(query.state.error),
    );
}

export function useCurioRestAccessError(endpoint: string): boolean {
  const queryClient = useQueryClient();

  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.query.queryKey[0] === curioRestKey[0]) {
          onStoreChange();
        }
      }),
    [queryClient],
  );
  const getSnapshot = useCallback(
    () => hasCurioRestQueryAccessError(queryClient, endpoint),
    [endpoint, queryClient],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
