import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Monitor } from "lucide-react";
import { useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { SectionCard } from "@/components/composed/section-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import type { MachineSummary } from "@/types/machine";

export const Route = createFileRoute("/_app/machines/")({
  component: MachinesPage,
});

const columns: ColumnDef<MachineSummary>[] = [
  {
    accessorKey: "ID",
    header: "ID",
  },
  {
    accessorKey: "Name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        to="/machines/$id"
        params={{ id: String(row.original.ID) }}
        className="font-medium text-[hsl(var(--primary))] hover:underline"
      >
        {row.original.Name || `Machine #${row.original.ID}`}
      </Link>
    ),
  },
  {
    accessorKey: "Cpu",
    header: "CPU",
  },
  {
    accessorKey: "RamHumanized",
    header: "RAM",
  },
  {
    accessorKey: "Gpu",
    header: "GPU",
  },
  {
    accessorKey: "RunningTasks",
    header: "Tasks",
  },
  {
    accessorKey: "SinceContact",
    header: "Last Contact",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const m = row.original;
      if (m.Restarting) {
        return <StatusBadge status="running" label="Restarting" />;
      }
      if (m.RestartRequest) {
        return <StatusBadge status="pending" label="Restart Pending" />;
      }
      if (m.Unschedulable) {
        return <StatusBadge status="warning" label="Unschedulable" />;
      }
      const contactMatch = m.SinceContact.match(/(\d+)s/);
      const seconds = contactMatch?.[1] ? parseInt(contactMatch[1], 10) : 0;
      if (seconds > 60) {
        return <StatusBadge status="failed" label="Offline" />;
      }
      return <StatusBadge status="done" label="Online" />;
    },
  },
];

function MachinesPage() {
  usePageTitle("Machines");
  const navigate = useNavigate();

  const { data, isLoading } = useCurioRpc<MachineSummary[]>(
    "ClusterMachines",
    [],
    { refetchInterval: 5_000 },
  );

  const machines = data ?? [];

  const stats = useMemo(() => {
    const total = machines.length;
    const online = machines.filter((m) => {
      const contactMatch = m.SinceContact.match(/(\d+)s/);
      const seconds = contactMatch?.[1] ? parseInt(contactMatch[1], 10) : 0;
      return seconds <= 60 && !m.Unschedulable;
    }).length;
    const unschedulable = machines.filter((m) => m.Unschedulable).length;
    const offline = total - online - unschedulable;
    const totalTasks = machines.reduce(
      (sum, m) => sum + (m.RunningTasks || 0),
      0,
    );
    const totalCpu = machines.reduce((sum, m) => sum + m.Cpu, 0);
    const totalGpu = machines.reduce((sum, m) => sum + m.Gpu, 0);
    return {
      total,
      online,
      offline,
      unschedulable,
      totalTasks,
      totalCpu,
      totalGpu,
    };
  }, [machines]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Cluster Machines</h1>

      {machines.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <KPICard
            label="Total"
            value={stats.total}
            subtitle={`${stats.online} online`}
          />
          <KPICard label="Online" value={stats.online} />
          <KPICard label="Offline" value={stats.offline} />
          <KPICard label="Unschedulable" value={stats.unschedulable} />
          <KPICard label="Running Tasks" value={stats.totalTasks} />
          <KPICard label="Total CPU" value={stats.totalCpu} subtitle="cores" />
          <KPICard label="Total GPU" value={stats.totalGpu} subtitle="units" />
        </div>
      )}

      <SectionCard title="Cluster Machines" icon={Monitor}>
        <DataTable
          columns={columns}
          data={machines}
          loading={isLoading}
          searchable
          searchPlaceholder="Search machines..."
          searchColumn="Name"
          emptyMessage="No machines found"
          onRowClick={(row) =>
            navigate({ to: "/machines/$id", params: { id: String(row.ID) } })
          }
        />
      </SectionCard>
    </div>
  );
}
