import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import type {
  IpniAdDetail,
  IpniEntryInfo,
  IpniProviderSummary,
} from "@/types/ipni";
import { adInvalidateKeys } from "./query-keys";

// ---------------------------------------------------------------------------
// IPNISummary — all providers + sync status
// ---------------------------------------------------------------------------

export function useIpniSummary() {
  return useCurioRpc<IpniProviderSummary[]>("IPNISummary", [], {
    refetchInterval: 30_000,
  });
}

// ---------------------------------------------------------------------------
// GetAd — advertisement detail by CID (ad CID or entry CID)
// ---------------------------------------------------------------------------

export function useGetAd(cid: string | null) {
  return useCurioRpc<IpniAdDetail>("GetAd", [cid ?? ""], {
    enabled: !!cid,
    refetchInterval: false,
  });
}

// ---------------------------------------------------------------------------
// IPNIEntry — entry detail by block CID
// ---------------------------------------------------------------------------

export function useIpniEntry(cid: string | null) {
  return useCurioRpc<IpniEntryInfo>("IPNIEntry", [cid ?? ""], {
    enabled: !!cid,
    refetchInterval: false,
  });
}

// ---------------------------------------------------------------------------
// IPNISetSkip — toggle skip flag on an advertisement
// ---------------------------------------------------------------------------

export function useIpniSetSkip() {
  return useCurioRpcMutation("IPNISetSkip", {
    invalidateKeys: adInvalidateKeys,
  });
}
