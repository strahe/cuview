import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/composed/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/utils/format";
import { useStorageDealInfo } from "../-module/queries";
import { extractNullable } from "../-module/types";

export const Route = createFileRoute("/_app/market/mk12/deal/$id")({
  component: MK12DealDetailPage,
});

function MK12DealDetailPage() {
  const { id } = Route.useParams();
  const { data: deal, isLoading, isError } = useStorageDealInfo(id);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        Loading deal {id.slice(0, 8)}…
      </div>
    );
  }

  if (isError || !deal) {
    return (
      <div className="space-y-3 py-8">
        <p className="text-destructive">
          Deal not found or failed to load: {id}
        </p>
        <Link
          to="/market/mk12/deals"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-3" /> Back to MK12 Deals
        </Link>
      </div>
    );
  }

  const chainDealId = extractNullable(
    deal.chain_deal_id as { Valid: boolean } | null,
  );
  const publishCid = extractNullable(
    deal.publish_cid as { Valid: boolean } | null,
  );
  const sector = extractNullable(deal.sector as { Valid: boolean } | null);
  const indexed =
    deal.indexed && typeof deal.indexed === "object" && deal.indexed.Valid
      ? deal.indexed.Bool
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/market/mk12/deals"
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back
        </Link>
        <h2 className="font-mono text-sm font-semibold">{deal.id}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Deal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <span className="text-muted-foreground">Miner</span>
              <div className="font-mono text-xs">{deal.miner}</div>
            </div>
            <div>
              <span className="text-muted-foreground">SP ID</span>
              <div>{deal.sp_id}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Created</span>
              <div className="text-xs">{deal.created_at}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Piece CID</span>
              <div className="truncate font-mono text-xs">{deal.piece_cid}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Piece CID v2</span>
              <div className="truncate font-mono text-xs">
                {deal.piece_cid_v2 || "—"}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Piece Size</span>
              <div>{formatBytes(deal.piece_size)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Epochs</span>
              <div className="text-xs">
                {deal.start_epoch} → {deal.end_epoch}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Sector</span>
              <div className="font-mono text-xs">{sector ?? "—"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Chain Deal ID</span>
              <div className="font-mono text-xs">{chainDealId ?? "—"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Publish CID</span>
              <div className="truncate font-mono text-xs">
                {publishCid ?? "—"}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Signed Proposal CID</span>
              <div className="truncate font-mono text-xs">
                {deal.signed_proposal_cid}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Client Peer ID</span>
              <div className="truncate font-mono text-xs">
                {deal.client_peer_id}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {deal.verified && <StatusBadge status="done" label="Verified" />}
            {deal.offline && <StatusBadge status="info" label="Offline" />}
            {deal.is_ddo && <StatusBadge status="info" label="DDO" />}
            {deal.fast_retrieval && (
              <StatusBadge status="done" label="Fast Retrieval" />
            )}
            {deal.announce_to_ipni && (
              <StatusBadge status="done" label="IPNI Announce" />
            )}
            {indexed === true && <StatusBadge status="done" label="Indexed" />}
            {indexed === false && (
              <StatusBadge status="pending" label="Not Indexed" />
            )}
          </div>
        </CardContent>
      </Card>

      {deal.url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data URL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all font-mono text-xs">{deal.url}</p>
          </CardContent>
        </Card>
      )}

      {deal.error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-destructive">
              {deal.error}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
