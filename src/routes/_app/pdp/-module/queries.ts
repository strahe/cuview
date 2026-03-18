import { keepPreviousData } from "@tanstack/react-query";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import {
  fsInvalidateKeys,
  keysInvalidateKeys,
  pipelinesInvalidateKeys,
  servicesInvalidateKeys,
} from "./query-keys";
import type {
  FSRegistryStatus,
  PdpDealListItem,
  PdpPipeline,
  PdpPipelineFailedStats,
  PdpService,
} from "./types";

// ---------------------------------------------------------------------------
// PDP Services
// ---------------------------------------------------------------------------

export function usePdpServices() {
  return useCurioRpc<PdpService[]>("PDPServices", [], {
    refetchInterval: 60_000,
  });
}

export function useAddPdpService() {
  return useCurioRpcMutation("AddPDPService", {
    invalidateKeys: servicesInvalidateKeys,
  });
}

export function useRemovePdpService() {
  return useCurioRpcMutation("RemovePDPService", {
    invalidateKeys: servicesInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// PDP Keys
// ---------------------------------------------------------------------------

export function usePdpKeys() {
  return useCurioRpc<string[]>("ListPDPKeys", [], {
    refetchInterval: 60_000,
  });
}

export function useImportPdpKey() {
  return useCurioRpcMutation<string>("ImportPDPKey", {
    invalidateKeys: keysInvalidateKeys,
  });
}

export function useRemovePdpKey() {
  return useCurioRpcMutation("RemovePDPKey", {
    invalidateKeys: keysInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// FS Registry
// ---------------------------------------------------------------------------

export function useFsRegistryStatus() {
  return useCurioRpc<FSRegistryStatus>("FSRegistryStatus", [], {
    refetchInterval: 120_000,
  });
}

export function useFsRegister() {
  return useCurioRpcMutation("FSRegister", {
    invalidateKeys: fsInvalidateKeys,
  });
}

export function useFsUpdateProvider() {
  return useCurioRpcMutation("FSUpdateProvider", {
    invalidateKeys: fsInvalidateKeys,
  });
}

export function useFsUpdatePdp() {
  return useCurioRpcMutation("FSUpdatePDP", {
    invalidateKeys: fsInvalidateKeys,
  });
}

export function useFsDeregister() {
  return useCurioRpcMutation("FSDeregister", {
    invalidateKeys: fsInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// PDP Pipelines
// ---------------------------------------------------------------------------

export function usePdpPipelines(limit = 25, offset = 0) {
  return useCurioRpc<PdpPipeline[]>("MK20PDPPipelines", [limit, offset], {
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function usePdpPipelineFailedTasks() {
  return useCurioRpc<PdpPipelineFailedStats>("MK20PDPPipelineFailedTasks", [], {
    refetchInterval: 60_000,
  });
}

export function usePdpBulkRestartFailed() {
  return useCurioRpcMutation("MK20BulkRestartFailedPDPTasks", {
    invalidateKeys: pipelinesInvalidateKeys,
  });
}

export function usePdpBulkRemoveFailed() {
  return useCurioRpcMutation("MK20BulkRemoveFailedPDPPipelines", {
    invalidateKeys: pipelinesInvalidateKeys,
  });
}

export function usePdpPipelineRemove() {
  return useCurioRpcMutation("MK20PDPPipelineRemove", {
    invalidateKeys: pipelinesInvalidateKeys,
  });
}

// ---------------------------------------------------------------------------
// PDP Deals
// ---------------------------------------------------------------------------

export function usePdpDeals(limit = 25, offset = 0) {
  return useCurioRpc<PdpDealListItem[]>(
    "MK20PDPStorageDeals",
    [limit, offset],
    { refetchInterval: 30_000, placeholderData: keepPreviousData },
  );
}
