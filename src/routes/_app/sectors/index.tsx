import { createFileRoute } from "@tanstack/react-router";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCurioRest } from "@/hooks/use-curio-query";
import { KPICard } from "@/components/composed/kpi-card";
import { SectionCard } from "@/components/composed/section-card";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/composed/status-badge";
import type { SectorListItem } from "@/types/sectors";
import type { ColumnDef } from "@tanstack/react-table";
import { Database } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/sectors/")({
  component: SectorsPage,
});

const columns: ColumnDef<SectorListItem>[] = [
  {
    accessorKey: "SectorNum",
    header: "Sector #",
  },
  {
    accessorKey: "MinerAddress",
    header: "Miner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.MinerAddress}</span>
    ),
  },
  {
    id: "storage",
    header: "Storage",
    cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="flex gap-1">
          {s.HasSealed && <StatusBadge status="done" label="Sealed" />}
          {s.HasUnsealed && <StatusBadge status="info" label="Unsealed" />}
          {s.HasSnap && <StatusBadge status="info" label="Snap" />}
        </div>
      );
    },
  },
  {
    id: "onChain",
    header: "On-Chain",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.IsOnChain ? "done" : "warning"}
        label={row.original.IsOnChain ? "Yes" : "No"}
      />
    ),
  },
  {
    id: "filPlus",
    header: "Fil+",
    cell: ({ row }) =>
      row.original.IsFilPlus ? (
        <StatusBadge status="done" label="Yes" />
      ) : (
        "—"
      ),
  },
  {
    id: "proving",
    header: "Proving",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.Proving ? "done" : "warning"}
        label={row.original.Proving ? "Yes" : "No"}
      />
    ),
  },
  {
    id: "flag",
    header: "Flag",
    cell: ({ row }) =>
      row.original.Flag ? (
        <StatusBadge status="failed" label="Flagged" />
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "ExpiresAt",
    header: "Expires",
  },
  {
    accessorKey: "Deals",
    header: "Deals",
  },
];

function SectorsPage() {
  usePageTitle("Sectors");

  const { data, isLoading } = useCurioRest<SectorListItem[]>("/sectors", {
    refetchInterval: 60_000,
  });

  const sectors = data ?? [];

  const stats = useMemo(() => {
    const total = sectors.length;
    const filPlus = sectors.filter((s) => s.IsFilPlus).length;
    const proving = sectors.filter((s) => s.Proving).length;
    const flagged = sectors.filter((s) => s.Flag).length;
    const snap = sectors.filter((s) => s.HasSnap).length;
    return { total, filPlus, proving, flagged, snap };
  }, [sectors]);

  const pct = (count: number) =>
    stats.total ? `${((count / stats.total) * 100).toFixed(1)}%` : "—";

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Sectors</h1>

      {sectors.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <KPICard label="Total Sectors" value={stats.total} />
          <KPICard label="Fil+" value={stats.filPlus} subtitle={pct(stats.filPlus)} />
          <KPICard label="Proving" value={stats.proving} subtitle={pct(stats.proving)} />
          <KPICard label="Flagged" value={stats.flagged} subtitle={pct(stats.flagged)} />
          <KPICard label="Snap" value={stats.snap} subtitle={pct(stats.snap)} />
        </div>
      )}

      <SectionCard title="Sector Inventory" icon={Database}>
        <DataTable
          columns={columns}
          data={sectors}
          loading={isLoading}
          searchable
          searchPlaceholder="Search sectors..."
          searchColumn="MinerAddress"
          emptyMessage="No sectors found"
        />
      </SectionCard>
    </div>
  );
}
