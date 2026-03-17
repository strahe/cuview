import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IpniAdDetail } from "@/types/ipni";

interface AdDetailCardProps {
  ad: IpniAdDetail;
  onToggleSkip: (adCid: string, skip: boolean) => void;
  skipPending?: boolean;
  onSearchAd?: (cid: string) => void;
  onScanEntries?: () => void;
}

export function AdDetailCard({
  ad,
  onToggleSkip,
  skipPending,
  onSearchAd,
  onScanEntries,
}: AdDetailCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Advertisement Detail</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onToggleSkip(ad.ad_cid, !ad.is_skip)}
          disabled={skipPending}
        >
          {ad.is_skip ? "Unskip" : "Skip"} Ad
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {/* Ad CIDs */}
          <div className="col-span-full">
            <div className="text-muted-foreground">
              Ad CID{ad.ad_cids?.length > 1 ? "s" : ""}
            </div>
            <div className="space-y-0.5">
              {ad.ad_cids?.length ? (
                ad.ad_cids.map((cid) => (
                  <div key={cid} className="font-mono text-xs break-all">
                    {cid}
                  </div>
                ))
              ) : (
                <div className="font-mono text-xs break-all">{ad.ad_cid}</div>
              )}
            </div>
          </div>

          {/* Miner */}
          <Field label="Miner" value={ad.miner} />

          {/* Provider ID */}
          <Field label="SP ID" value={String(ad.sp_id)} />

          {/* Status badges */}
          <div>
            <div className="text-muted-foreground">Status</div>
            <div className="flex gap-1">
              {ad.is_rm && <Badge variant="destructive">Removed</Badge>}
              {ad.is_skip && <Badge variant="outline">Skipped</Badge>}
              {!ad.is_rm && !ad.is_skip && <Badge>Active</Badge>}
            </div>
          </div>

          {/* Previous - clickable link */}
          <div>
            <div className="text-muted-foreground">Previous</div>
            {ad.previous ? (
              onSearchAd ? (
                <button
                  type="button"
                  className="font-mono text-xs text-primary break-all hover:underline"
                  onClick={() => onSearchAd(ad.previous)}
                >
                  {ad.previous}
                </button>
              ) : (
                <div className="font-mono text-xs break-all">{ad.previous}</div>
              )
            ) : (
              <div>—</div>
            )}
          </div>

          {/* Addresses */}
          <div>
            <div className="text-muted-foreground">Addresses</div>
            <div className="font-mono text-xs break-all">
              {ad.addresses || "—"}
            </div>
          </div>

          {/* Context ID */}
          <div className="col-span-full">
            <div className="text-muted-foreground">Context ID</div>
            <div className="font-mono text-xs break-all">
              {ad.context_id || "—"}
            </div>
          </div>

          {/* Entries head + SCAN button */}
          <div>
            <div className="text-muted-foreground">Entries Head</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs break-all">
                {ad.entries || "—"}
              </span>
              {ad.entries && onScanEntries && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={onScanEntries}
                >
                  SCAN
                </Button>
              )}
            </div>
          </div>

          {/* Entry Count / CID Count */}
          <Field label="Entry Count" value={String(ad.entry_count)} />
          <Field label="CID Count" value={String(ad.cid_count)} />

          {/* Piece CID (V1) */}
          <div className="col-span-full">
            <div className="text-muted-foreground">Piece CID</div>
            <div className="font-mono text-xs break-all">
              {ad.piece_cid || "—"}
            </div>
          </div>

          {/* Piece CID V2 */}
          <div className="col-span-full">
            <div className="text-muted-foreground">Piece CID V2</div>
            <div className="font-mono text-xs break-all">
              {ad.piece_cid_v2 || "—"}
            </div>
          </div>

          {/* Piece Size */}
          <Field label="Piece Size" value={String(ad.piece_size)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div>{value}</div>
    </div>
  );
}
