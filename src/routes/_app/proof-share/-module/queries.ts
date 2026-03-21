import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import {
  clientSettingsInvalidateKeys,
  clientWalletsInvalidateKeys,
  providerAsksInvalidateKeys,
  providerMetaInvalidateKeys,
  providerSettlementsInvalidateKeys,
} from "./query-keys";
import type {
  PsClientMessage,
  PsClientRequest,
  PsClientSettings,
  PsClientWallet,
  PsMeta,
  PsPaymentSummary,
  PsQueueItem,
  PsSettlement,
  PsTos,
  PsWorkAsk,
} from "./types";

// ---------------------------------------------------------------------------
// Provider – Queries
// ---------------------------------------------------------------------------

export function usePsMeta() {
  return useCurioRpc<PsMeta>("PSGetMeta", [], { refetchInterval: 30_000 });
}

export function usePsListQueue() {
  return useCurioRpc<PsQueueItem[]>("PSListQueue", [], {
    refetchInterval: 15_000,
  });
}

export function usePsPaymentSummary() {
  return useCurioRpc<PsPaymentSummary[]>("PSProviderLastPaymentsSummary", [], {
    refetchInterval: 60_000,
  });
}

export function usePsListAsks() {
  return useCurioRpc<PsWorkAsk[]>("PSListAsks", [], {
    refetchInterval: 30_000,
  });
}

export function usePsListSettlements() {
  return useCurioRpc<PsSettlement[]>("PSListSettlements", [], {
    refetchInterval: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Provider – Mutations
// ---------------------------------------------------------------------------

export function usePsSetMeta() {
  return useCurioRpcMutation("PSSetMeta", {
    invalidateKeys: providerMetaInvalidateKeys,
  });
}

export function usePsAskWithdraw() {
  return useCurioRpcMutation("PSAskWithdraw", {
    invalidateKeys: providerAsksInvalidateKeys,
  });
}

export function usePsProviderSettle() {
  return useCurioRpcMutation<string>("PSProviderSettle", {
    invalidateKeys: providerSettlementsInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// Client – Queries
// ---------------------------------------------------------------------------

export function usePsClientGet() {
  return useCurioRpc<PsClientSettings[]>("PSClientGet", [], {
    refetchInterval: 30_000,
  });
}

export function usePsClientWallets() {
  return useCurioRpc<PsClientWallet[]>("PSClientWallets", [], {
    refetchInterval: 30_000,
  });
}

export function usePsClientRequests(spId: number, enabled: boolean) {
  return useCurioRpc<PsClientRequest[]>("PSClientRequests", [spId], {
    enabled,
  });
}

export function usePsClientMessages() {
  return useCurioRpc<PsClientMessage[]>("PSClientListMessages", [], {
    refetchInterval: 30_000,
  });
}

export function usePsTos() {
  return useCurioRpc<PsTos>("PSGetTos", [], { refetchInterval: 300_000 });
}

// ---------------------------------------------------------------------------
// Client – Mutations
// ---------------------------------------------------------------------------

export function usePsClientSet() {
  return useCurioRpcMutation("PSClientSet", {
    invalidateKeys: clientSettingsInvalidateKeys,
  });
}

export function usePsClientRemove() {
  return useCurioRpcMutation("PSClientRemove", {
    invalidateKeys: clientSettingsInvalidateKeys,
  });
}

export function usePsClientAddWallet() {
  return useCurioRpcMutation("PSClientAddWallet", {
    invalidateKeys: clientWalletsInvalidateKeys,
  });
}

export function usePsRouterAddBalance() {
  return useCurioRpcMutation<string>("PSClientRouterAddBalance", {
    invalidateKeys: clientWalletsInvalidateKeys,
  });
}

export function usePsRouterRequestWithdrawal() {
  return useCurioRpcMutation<string>("PSClientRouterRequestWithdrawal", {
    invalidateKeys: clientWalletsInvalidateKeys,
  });
}

export function usePsRouterCancelWithdrawal() {
  return useCurioRpcMutation<string>("PSClientRouterCancelWithdrawal", {
    invalidateKeys: clientWalletsInvalidateKeys,
  });
}

export function usePsRouterCompleteWithdrawal() {
  return useCurioRpcMutation<string>("PSClientRouterCompleteWithdrawal", {
    invalidateKeys: clientWalletsInvalidateKeys,
  });
}
