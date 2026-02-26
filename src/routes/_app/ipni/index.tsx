import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Globe, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import type {
  IpniAdDetail,
  IpniEntryInfo,
  IpniProviderSummary,
} from "@/types/ipni";

export const Route = createFileRoute("/_app/ipni/")({
  component: IpniPage,
});

type IpniTab = "overview" | "ads" | "entries";

const providerColumns: ColumnDef<IpniProviderSummary>[] = [
  {
    accessorKey: "miner",
    header: "Miner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.miner}</span>
    ),
  },
  {
    accessorKey: "peer_id",
    header: "Peer ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.peer_id?.slice(0, 16)}…
      </span>
    ),
  },
  {
    accessorKey: "head",
    header: "Head",
    cell: ({ row }) =>
      row.original.head ? (
        <span className="font-mono text-xs">
          {row.original.head.slice(0, 16)}…
        </span>
      ) : (
        "—"
      ),
  },
  {
    id: "syncStatus",
    header: "Sync Status",
    cell: ({ row }) => {
      const statuses = row.original.sync_status;
      if (!statuses?.length) return "—";
      const hasError = statuses.some((s) => s.error);
      return (
        <StatusBadge
          status={hasError ? "warning" : "done"}
          label={hasError ? "Issues" : "OK"}
        />
      );
    },
  },
];

function IpniPage() {
  usePageTitle("IPNI");
  const [activeTab, setActiveTab] = useState<IpniTab>("overview");

  const { data: summary, isLoading } = useCurioRpc<IpniProviderSummary[]>(
    "IPNISummary",
    [],
    { refetchInterval: 30_000 },
  );

  const providers = summary ?? [];

  const stats = useMemo(() => {
    const total = providers.length;
    const withHead = providers.filter((p) => p.head).length;
    const withErrors = providers.filter((p) =>
      p.sync_status?.some((s) => s.error),
    ).length;
    return { total, withHead, withErrors };
  }, [providers]);

  // Ad search
  const [adSearchCid, setAdSearchCid] = useState("");
  const [searchedAdCid, setSearchedAdCid] = useState("");
  const { data: adDetail, isLoading: adLoading } = useCurioRpc<IpniAdDetail>(
    "GetAd",
    [searchedAdCid],
    { enabled: !!searchedAdCid, refetchInterval: false },
  );

  const setSkipMutation = useCurioRpcMutation("IPNISetSkip", {
    invalidateKeys: [["curio", "GetAd"]],
  });

  const handleAdSearch = useCallback(() => {
    if (adSearchCid.trim()) setSearchedAdCid(adSearchCid.trim());
  }, [adSearchCid]);

  // Entry search
  const [entryCid, setEntryCid] = useState("");
  const [searchedEntryCid, setSearchedEntryCid] = useState("");
  const { data: entryInfo, isLoading: entryLoading } =
    useCurioRpc<IpniEntryInfo>("IPNIEntry", [searchedEntryCid], {
      enabled: !!searchedEntryCid,
      refetchInterval: false,
    });

  const handleEntrySearch = useCallback(() => {
    if (entryCid.trim()) setSearchedEntryCid(entryCid.trim());
  }, [entryCid]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Globe className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">IPNI</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as IpniTab)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ads">Advertisements</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <KPICard label="Providers" value={stats.total} />
            <KPICard label="With Head" value={stats.withHead} />
            <KPICard label="With Errors" value={stats.withErrors} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={providerColumns}
                data={providers}
                loading={isLoading}
                emptyMessage="No IPNI providers"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "ads" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advertisement Lookup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter advertisement CID (bafy...)"
                  value={adSearchCid}
                  onChange={(e) => setAdSearchCid(e.target.value)}
                  className="max-w-lg font-mono text-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleAdSearch()}
                />
                <Button
                  size="sm"
                  onClick={handleAdSearch}
                  disabled={adLoading || !adSearchCid.trim()}
                >
                  <Search className="mr-1 size-4" />
                  {adLoading ? "Searching..." : "Search"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {adDetail && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Advertisement Detail</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSkipMutation.mutate([searchedAdCid, !adDetail.is_skip])
                  }
                  disabled={setSkipMutation.isPending}
                >
                  {adDetail.is_skip ? "Unskip" : "Skip"} Ad
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Ad CID</div>
                    <div className="font-mono text-xs break-all">
                      {adDetail.ad_cid}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Miner</div>
                    <div>{adDetail.miner}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Piece CID</div>
                    <div className="font-mono text-xs break-all">
                      {adDetail.piece_cid || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Piece Size</div>
                    <div>{adDetail.piece_size}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Entry Count</div>
                    <div>{adDetail.entry_count}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">CID Count</div>
                    <div>{adDetail.cid_count}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <div className="flex gap-1">
                      {adDetail.is_rm && (
                        <Badge variant="destructive">Removed</Badge>
                      )}
                      {adDetail.is_skip && (
                        <Badge variant="outline">Skipped</Badge>
                      )}
                      {!adDetail.is_rm && !adDetail.is_skip && (
                        <Badge>Active</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Previous</div>
                    <div className="font-mono text-xs">
                      {adDetail.previous || "—"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "entries" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entry Lookup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter entry block CID (bafy...)"
                  value={entryCid}
                  onChange={(e) => setEntryCid(e.target.value)}
                  className="max-w-lg font-mono text-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleEntrySearch()}
                />
                <Button
                  size="sm"
                  onClick={handleEntrySearch}
                  disabled={entryLoading || !entryCid.trim()}
                >
                  <Search className="mr-1 size-4" />
                  {entryLoading ? "Searching..." : "Search"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {entryInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Entry Detail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Piece CID</div>
                    <div className="font-mono text-xs break-all">
                      {entryInfo.PieceCID}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">From CAR</div>
                    <div>{entryInfo.FromCar ? "Yes" : "No"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Num Blocks</div>
                    <div>{entryInfo.NumBlocks}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Size</div>
                    <div>{entryInfo.Size}</div>
                  </div>
                  {entryInfo.StartOffset != null && (
                    <div>
                      <div className="text-muted-foreground">Start Offset</div>
                      <div>{entryInfo.StartOffset}</div>
                    </div>
                  )}
                  {entryInfo.Err && (
                    <div className="col-span-2">
                      <div className="text-muted-foreground">Error</div>
                      <div className="text-destructive">{entryInfo.Err}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
