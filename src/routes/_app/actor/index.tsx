import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { DataTable } from "@/components/table/data-table";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import type { ActorSummaryData } from "@/types/actor";
import { formatFilecoin } from "@/utils/filecoin";

export const Route = createFileRoute("/_app/actor/")({
  component: ActorListPage,
});

const columns: ColumnDef<ActorSummaryData>[] = [
  {
    accessorKey: "Address",
    header: "Address",
    cell: ({ row }) => (
      <Link
        to="/actor/$id"
        params={{ id: row.original.Address }}
        className="font-mono text-xs text-[hsl(var(--primary))] hover:underline"
      >
        {row.original.Address}
      </Link>
    ),
  },
  {
    accessorKey: "QualityAdjustedPower",
    header: "QaP",
  },
  {
    accessorKey: "ActorBalance",
    header: "Balance",
    cell: ({ row }) => formatFilecoin(row.original.ActorBalance),
  },
  {
    accessorKey: "ActorAvailable",
    header: "Available",
    cell: ({ row }) => formatFilecoin(row.original.ActorAvailable),
  },
  {
    accessorKey: "Win1",
    header: "Wins (1d)",
  },
  {
    accessorKey: "Win7",
    header: "Wins (7d)",
  },
  {
    accessorKey: "Win30",
    header: "Wins (30d)",
  },
  {
    id: "layers",
    header: "Layers",
    cell: ({ row }) => row.original.CLayers?.join(", ") || "—",
  },
];

function ActorListPage() {
  usePageTitle("Actors");
  const navigate = useNavigate();

  const { data, isLoading } = useCurioRpc<ActorSummaryData[]>(
    "ActorSummary",
    [],
    { refetchInterval: 30_000 },
  );

  const actors = data ?? [];

  const stats = useMemo(() => {
    const total = actors.length;
    const totalWins1d = actors.reduce((sum, a) => sum + (a.Win1 || 0), 0);
    const totalWins7d = actors.reduce((sum, a) => sum + (a.Win7 || 0), 0);
    const totalWins30d = actors.reduce((sum, a) => sum + (a.Win30 || 0), 0);
    return { total, totalWins1d, totalWins7d, totalWins30d };
  }, [actors]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Actors</h1>

      {actors.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KPICard label="Total Actors" value={stats.total} />
          <KPICard label="Wins (1d)" value={stats.totalWins1d} />
          <KPICard label="Wins (7d)" value={stats.totalWins7d} />
          <KPICard label="Wins (30d)" value={stats.totalWins30d} />
        </div>
      )}

      <DataTable
        columns={columns}
        data={actors}
        loading={isLoading}
        searchable
        searchPlaceholder="Search actors..."
        searchColumn="Address"
        emptyMessage="No actors found"
        onRowClick={(row) =>
          navigate({ to: "/actor/$id", params: { id: row.Address } })
        }
      />
    </div>
  );
}
