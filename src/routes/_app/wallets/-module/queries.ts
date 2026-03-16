import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useCurioApi, useCurioConnection } from "@/contexts/curio-api-context";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import type {
  BalanceManagerRule,
  MessageDetail,
  PendingMessages,
} from "@/types/wallet";
import { normalizeBalanceRule, normalizeWalletList } from "./adapters";
import {
  balanceRuleInvalidateKeys,
  walletInvalidateKeys,
  walletQueryKeys,
} from "./query-keys";
import type { ApiWalletInfoShort, WalletNamesMap } from "./types";

// ---------------------------------------------------------------------------
// Wallet Names
// ---------------------------------------------------------------------------

export function useWalletNames() {
  return useCurioRpc<WalletNamesMap>("WalletNames", [], {
    refetchInterval: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Wallet List (names + per-wallet balance info)
// ---------------------------------------------------------------------------

export function useWalletList() {
  const namesQuery = useWalletNames();
  const api = useCurioApi();
  const { endpoint } = useCurioConnection();
  const addresses = useMemo(
    () => Object.keys(namesQuery.data ?? {}),
    [namesQuery.data],
  );

  const infoQueries = useQueries({
    queries: addresses.map((addr) => ({
      queryKey: [...walletQueryKeys.infoShort, endpoint, addr] as const,
      queryFn: () => api.call<ApiWalletInfoShort>("WalletInfoShort", [addr]),
      refetchInterval: 30_000,
      enabled: !!namesQuery.data,
    })),
    combine: (results) => ({
      results,
      isLoading: results.some((result) => result.isLoading),
    }),
  });

  const { infoMap, loadingSet, errorSet } = useMemo(() => {
    const map: Record<string, ApiWalletInfoShort | undefined> = {};
    const loading = new Set<string>();
    const errors = new Set<string>();
    for (let i = 0; i < addresses.length; i++) {
      const addr = addresses[i];
      if (!addr) continue;
      const q = infoQueries.results[i];
      if (q?.data) map[addr] = q.data;
      if (q?.isLoading) loading.add(addr);
      if (q?.isError) errors.add(addr);
    }
    return { infoMap: map, loadingSet: loading, errorSet: errors };
  }, [addresses, infoQueries.results]);

  const data = useMemo(
    () =>
      namesQuery.data
        ? normalizeWalletList(namesQuery.data, infoMap, loadingSet, errorSet)
        : [],
    [namesQuery.data, infoMap, loadingSet, errorSet],
  );

  return {
    data,
    isLoading: namesQuery.isLoading || infoQueries.isLoading,
    isError: namesQuery.isError,
    error: namesQuery.error,
  };
}

// ---------------------------------------------------------------------------
// Wallet Mutations
// ---------------------------------------------------------------------------

export function useAddWallet() {
  return useCurioRpcMutation("WalletAdd", {
    invalidateKeys: walletInvalidateKeys,
  });
}

export function useRemoveWallet() {
  return useCurioRpcMutation("WalletRemove", {
    invalidateKeys: walletInvalidateKeys,
  });
}

export function useRenameWallet() {
  return useCurioRpcMutation("WalletNameChange", {
    invalidateKeys: walletInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// Balance Manager
// ---------------------------------------------------------------------------

export function useBalanceRules() {
  const query = useCurioRpc<BalanceManagerRule[]>("BalanceMgrRules", [], {
    refetchInterval: 60_000,
  });

  const data = useMemo(
    () => (query.data ?? []).map(normalizeBalanceRule),
    [query.data],
  );

  return { ...query, data };
}

export function useAddBalanceRule() {
  return useCurioRpcMutation("BalanceMgrRuleAdd", {
    invalidateKeys: balanceRuleInvalidateKeys,
  });
}

export function useUpdateBalanceRule() {
  return useCurioRpcMutation("BalanceMgrRuleUpdate", {
    invalidateKeys: balanceRuleInvalidateKeys,
  });
}

export function useRemoveBalanceRule() {
  return useCurioRpcMutation("BalanceMgrRuleRemove", {
    invalidateKeys: balanceRuleInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export function usePendingMessages() {
  return useCurioRpc<PendingMessages>("PendingMessages", [], {
    refetchInterval: 20_000,
  });
}

export function useMessageByCid(cid: string | null) {
  return useCurioRpc<MessageDetail>("MessageByCid", [cid!], {
    enabled: !!cid,
  });
}
