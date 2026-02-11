import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import { StatusBadge } from "@/components/composed/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { formatBytes } from "@/utils/format";

export const Route = createFileRoute("/_app/market/pieces")({
  component: PiecesPage,
});

interface PieceDeal {
  id: string;
  sp_id: number;
  miner: string;
  chain_deal_id: number;
  sector: number;
  length: number;
  raw_size: number;
  offset?: { Valid: boolean; Int64: number } | null;
  mk20: boolean;
  boost_deal: boolean;
  legacy_deal: boolean;
}

interface PieceInfoResult {
  piece_cid_v2: string;
  piece_cid: string;
  size: number;
  ipni_ads: string[] | null;
  created_at: string;
  indexed_at: string;
  indexed: boolean;
  deals: PieceDeal[] | null;
}

function PiecesPage() {
  const [query, setQuery] = useState("");
  const [searchCid, setSearchCid] = useState<string | null>(null);

  const {
    data: pieceInfo,
    isLoading,
    isError,
  } = useCurioRpc<PieceInfoResult>("PieceInfo", [searchCid!], {
    enabled: !!searchCid,
  });

  const handleSearch = useCallback(() => {
    const cid = query.trim();
    if (cid) setSearchCid(cid);
  }, [query]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-4" /> Piece Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter Piece CID v2..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-lg font-mono text-xs"
            />
            <Button
              onClick={handleSearch}
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>

          {isError && searchCid && (
            <p className="mt-3 text-sm text-[hsl(var(--destructive))]">
              Piece not found or invalid CID
            </p>
          )}

          {pieceInfo && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-[hsl(var(--muted-foreground))]">
                    Piece CID v2
                  </div>
                  <div className="truncate font-mono text-xs">
                    {pieceInfo.piece_cid_v2}
                  </div>
                </div>
                <div>
                  <div className="text-[hsl(var(--muted-foreground))]">
                    Piece CID v1
                  </div>
                  <div className="truncate font-mono text-xs">
                    {pieceInfo.piece_cid}
                  </div>
                </div>
                <div>
                  <div className="text-[hsl(var(--muted-foreground))]">
                    Size
                  </div>
                  <div className="font-medium">
                    {formatBytes(pieceInfo.size)}
                  </div>
                </div>
                <div>
                  <div className="text-[hsl(var(--muted-foreground))]">
                    Indexed
                  </div>
                  <StatusBadge
                    status={pieceInfo.indexed ? "done" : "pending"}
                    label={pieceInfo.indexed ? "Yes" : "No"}
                  />
                </div>
                <div>
                  <div className="text-[hsl(var(--muted-foreground))]">
                    Created
                  </div>
                  <div className="text-xs">{pieceInfo.created_at}</div>
                </div>
                <div>
                  <div className="text-[hsl(var(--muted-foreground))]">
                    Indexed At
                  </div>
                  <div className="text-xs">{pieceInfo.indexed_at}</div>
                </div>
              </div>

              {pieceInfo.ipni_ads && pieceInfo.ipni_ads.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    IPNI Advertisements ({pieceInfo.ipni_ads.length})
                  </h4>
                  <div className="max-h-24 space-y-1 overflow-y-auto">
                    {pieceInfo.ipni_ads.map((ad, i) => (
                      <div
                        key={i}
                        className="truncate rounded border border-[hsl(var(--border))] px-2 py-1 font-mono text-xs"
                      >
                        {ad}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pieceInfo.deals && pieceInfo.deals.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    Deals ({pieceInfo.deals.length})
                  </h4>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {pieceInfo.deals.map((d) => (
                      <div
                        key={d.id}
                        className="rounded border border-[hsl(var(--border))] p-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono">{d.miner}</span>
                          <div className="flex gap-1">
                            {d.mk20 && (
                              <StatusBadge status="info" label="MK20" />
                            )}
                            {d.boost_deal && (
                              <StatusBadge status="info" label="Boost" />
                            )}
                            {d.legacy_deal && (
                              <StatusBadge status="info" label="Legacy" />
                            )}
                          </div>
                        </div>
                        <div className="mt-1 grid grid-cols-3 gap-2 text-[hsl(var(--muted-foreground))]">
                          <span>Sector: {d.sector}</span>
                          <span>Chain Deal: {d.chain_deal_id}</span>
                          <span>Size: {formatBytes(d.length)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
