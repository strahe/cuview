import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import type { IpniProviderSummary } from "@/types/ipni";
import type { ColumnDef } from "@tanstack/react-table";
import { Globe } from "lucide-react";
import { useMemo } from "react";

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Globe className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">IPNI</h1>
      </div>

      <TabsList>
        <TabsTrigger
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          active={activeTab === "ads"}
          onClick={() => setActiveTab("ads")}
        >
          Advertisements
        </TabsTrigger>
        <TabsTrigger
          active={activeTab === "entries"}
          onClick={() => setActiveTab("entries")}
        >
          Entries
        </TabsTrigger>
      </TabsList>

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
        <Card>
          <CardHeader>
            <CardTitle>Advertisements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Advertisement browsing — select a provider to view ads.
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === "entries" && (
        <Card>
          <CardHeader>
            <CardTitle>Entry Lookup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Look up entries by CID.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
