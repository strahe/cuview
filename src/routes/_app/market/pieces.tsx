import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import { StatusBadge } from "@/components/composed/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface PieceDealDetailItem {
  deal_id: number;
  piece_cid: string;
  is_ddo: boolean;
  sp_id: number;
  miner: string;
  sector_num: number;
  start_epoch: number;
  end_epoch: number;
  piece_size: number;
}

interface PieceParkState {
  piece_cid: string;
  state: string;
  complete: boolean;
  created_at: string;
  url?: string;
}

interface StorageDealSummary {
  id: string;
  sp_id: number;
  sector?: { Valid: boolean; Int64: number } | null;
  created_at: string;
  signed_proposal_cid: string;
  offline: boolean;
  verified: boolean;
  start_epoch: number;
  end_epoch: number;
  client_peer_id: string;
  chain_deal_id?: { Valid: boolean; Int64: number } | null;
  publish_cid?: { Valid: boolean; String: string } | null;
  piece_cid: string;
  piece_size: number;
  fast_retrieval: boolean;
  announce_to_ipni: boolean;
  url?: string;
  url_headers?: Record<string, string[]>;
  error?: string;
  miner: string;
  indexed?: { Valid: boolean; Bool: boolean } | null;
  is_ddo: boolean;
  piece_cid_v2: string;
}

interface ContentEntry {
  piece_cid: string;
  data_url: string;
  sp_id: number;
  sector_num: number;
}

interface UploadStatus {
  id: string;
  status: string;
}

function PiecesPage() {
  const [tab, setTab] = useState("piece");
  const [query, setQuery] = useState("");
  const [searchCid, setSearchCid] = useState<string | null>(null);
  const [contentQuery, setContentQuery] = useState("");
  const [contentSearch, setContentSearch] = useState<string | null>(null);
  const [dataUrlQuery, setDataUrlQuery] = useState("");
  const [dataUrlSearch, setDataUrlSearch] = useState<string | null>(null);
  const [dealInfoQuery, setDealInfoQuery] = useState("");
  const [dealInfoSearch, setDealInfoSearch] = useState<string | null>(null);
  const [uploadIdQuery, setUploadIdQuery] = useState("");
  const [uploadIdSearch, setUploadIdSearch] = useState<string | null>(null);
  const [showDealDetail, setShowDealDetail] = useState<string | null>(null);

  const {
    data: pieceInfo,
    isLoading,
    isError,
  } = useCurioRpc<PieceInfoResult>("PieceInfo", [searchCid!], {
    enabled: !!searchCid,
  });

  const { data: dealDetail } = useCurioRpc<PieceDealDetailItem[]>(
    "PieceDealDetail",
    [searchCid!],
    { enabled: !!searchCid && !!pieceInfo },
  );

  const { data: parkStates } = useCurioRpc<PieceParkState[]>(
    "PieceParkStates",
    [searchCid!],
    { enabled: !!searchCid && !!pieceInfo },
  );

  const { data: contentResults } = useCurioRpc<ContentEntry[]>(
    "FindContentByCID",
    [contentSearch!],
    { enabled: !!contentSearch },
  );

  const { data: dataUrlResults } = useCurioRpc<ContentEntry[]>(
    "FindEntriesByDataURL",
    [dataUrlSearch!],
    { enabled: !!dataUrlSearch },
  );

  const { data: dealInfo } = useCurioRpc<StorageDealSummary>(
    "StorageDealInfo",
    [dealInfoSearch!],
    { enabled: !!dealInfoSearch },
  );

  const { data: uploadStatus } = useCurioRpc<UploadStatus>(
    "ChunkUploadStatus",
    [uploadIdSearch!],
    { enabled: !!uploadIdSearch },
  );

  const handleSearch = useCallback(() => {
    const cid = query.trim();
    if (cid) setSearchCid(cid);
  }, [query]);

  return (
    <div className="space-y-6">
      <Tabs>
        <TabsList>
          <TabsTrigger active={tab === "piece"} onClick={() => setTab("piece")}>
            Piece Lookup
          </TabsTrigger>
          <TabsTrigger
            active={tab === "content"}
            onClick={() => setTab("content")}
          >
            Content Search
          </TabsTrigger>
          <TabsTrigger active={tab === "deal"} onClick={() => setTab("deal")}>
            Deal Info
          </TabsTrigger>
          <TabsTrigger
            active={tab === "upload"}
            onClick={() => setTab("upload")}
          >
            Upload Status
          </TabsTrigger>
        </TabsList>
        <TabsContent>
          {tab === "piece" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="size-4" /> Piece Lookup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter Piece CID..."
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
                              className="cursor-pointer rounded border border-[hsl(var(--border))] p-2 text-xs hover:bg-[hsl(var(--muted))]"
                              onClick={() => setShowDealDetail(d.id)}
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

                    {dealDetail && dealDetail.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium">
                          Deal Details ({dealDetail.length})
                        </h4>
                        <div className="max-h-48 space-y-2 overflow-y-auto">
                          {dealDetail.map((d) => (
                            <div
                              key={d.deal_id}
                              className="rounded border border-[hsl(var(--border))] p-2 text-xs"
                            >
                              <div className="grid grid-cols-3 gap-2">
                                <span>
                                  Deal #{d.deal_id}{" "}
                                  {d.is_ddo && (
                                    <StatusBadge status="info" label="DDO" />
                                  )}
                                </span>
                                <span className="font-mono">{d.miner}</span>
                                <span>Sector: {d.sector_num}</span>
                              </div>
                              <div className="mt-1 grid grid-cols-3 gap-2 text-[hsl(var(--muted-foreground))]">
                                <span>Start: {d.start_epoch}</span>
                                <span>End: {d.end_epoch}</span>
                                <span>Size: {formatBytes(d.piece_size)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {parkStates && parkStates.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium">
                          Park States ({parkStates.length})
                        </h4>
                        <div className="max-h-32 space-y-1 overflow-y-auto">
                          {parkStates.map((ps, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded border border-[hsl(var(--border))] p-2 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span>{ps.state}</span>
                                <StatusBadge
                                  status={ps.complete ? "done" : "pending"}
                                  label={ps.complete ? "Complete" : "Active"}
                                />
                              </div>
                              <span className="text-[hsl(var(--muted-foreground))]">
                                {ps.created_at}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {tab === "content" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="size-4" /> Content Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search by CID..."
                    value={contentQuery}
                    onChange={(e) => setContentQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && contentQuery.trim())
                        setContentSearch(contentQuery.trim());
                    }}
                    className="max-w-lg font-mono text-xs"
                  />
                  <Button
                    onClick={() => setContentSearch(contentQuery.trim())}
                    disabled={!contentQuery.trim()}
                  >
                    Search
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search by Data URL..."
                    value={dataUrlQuery}
                    onChange={(e) => setDataUrlQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && dataUrlQuery.trim())
                        setDataUrlSearch(dataUrlQuery.trim());
                    }}
                    className="max-w-lg text-xs"
                  />
                  <Button
                    onClick={() => setDataUrlSearch(dataUrlQuery.trim())}
                    disabled={!dataUrlQuery.trim()}
                  >
                    Search
                  </Button>
                </div>
                {(contentResults ?? dataUrlResults) && (
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {(contentResults ?? dataUrlResults ?? []).map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded border border-[hsl(var(--border))] p-2 text-xs"
                      >
                        <span className="truncate font-mono">
                          {e.piece_cid}
                        </span>
                        <div className="flex gap-3 text-[hsl(var(--muted-foreground))]">
                          <span>SP: {e.sp_id}</span>
                          <span>Sector: {e.sector_num}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {tab === "deal" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="size-4" /> Deal Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter deal CID or UUID..."
                    value={dealInfoQuery}
                    onChange={(e) => setDealInfoQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && dealInfoQuery.trim())
                        setDealInfoSearch(dealInfoQuery.trim());
                    }}
                    className="max-w-lg font-mono text-xs"
                  />
                  <Button
                    onClick={() => setDealInfoSearch(dealInfoQuery.trim())}
                    disabled={!dealInfoQuery.trim()}
                  >
                    Search
                  </Button>
                </div>
                {dealInfo && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))]">
                          ID
                        </span>
                        <div className="truncate font-mono text-xs">
                          {dealInfo.id}
                        </div>
                      </div>
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Miner
                        </span>
                        <div className="font-mono text-xs">
                          {dealInfo.miner}
                        </div>
                      </div>
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Piece CID
                        </span>
                        <div className="truncate font-mono text-xs">
                          {dealInfo.piece_cid}
                        </div>
                      </div>
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Size
                        </span>
                        <div>{formatBytes(dealInfo.piece_size)}</div>
                      </div>
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Epochs
                        </span>
                        <div className="text-xs">
                          {dealInfo.start_epoch} → {dealInfo.end_epoch}
                        </div>
                      </div>
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Flags
                        </span>
                        <div className="flex gap-1">
                          {dealInfo.verified && (
                            <StatusBadge status="done" label="Verified" />
                          )}
                          {dealInfo.offline && (
                            <StatusBadge status="info" label="Offline" />
                          )}
                          {dealInfo.is_ddo && (
                            <StatusBadge status="info" label="DDO" />
                          )}
                          {dealInfo.fast_retrieval && (
                            <StatusBadge status="done" label="Fast" />
                          )}
                        </div>
                      </div>
                    </div>
                    {dealInfo.error && (
                      <p className="text-sm text-[hsl(var(--destructive))]">
                        {dealInfo.error}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {tab === "upload" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="size-4" /> Upload Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter upload ID..."
                    value={uploadIdQuery}
                    onChange={(e) => setUploadIdQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && uploadIdQuery.trim())
                        setUploadIdSearch(uploadIdQuery.trim());
                    }}
                    className="max-w-lg font-mono text-xs"
                  />
                  <Button
                    onClick={() => setUploadIdSearch(uploadIdQuery.trim())}
                    disabled={!uploadIdQuery.trim()}
                  >
                    Check
                  </Button>
                </div>
                {uploadStatus && (
                  <div className="rounded border border-[hsl(var(--border))] p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs">
                        {uploadStatus.id}
                      </span>
                      <StatusBadge status="info" label={uploadStatus.status} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {showDealDetail && (
        <Dialog open onOpenChange={() => setShowDealDetail(null)}>
          <DialogContent
            className="max-w-md"
            onClose={() => setShowDealDetail(null)}
          >
            <DialogHeader>
              <DialogTitle>Deal {showDealDetail.slice(0, 12)}…</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Use the Deal Info tab to look up full deal details.
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
