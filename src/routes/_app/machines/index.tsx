import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Monitor, Pause, Play, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { SectionCard } from "@/components/composed/section-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import type { MachineSummary } from "@/types/machine";

export const Route = createFileRoute("/_app/machines/")({
  component: MachinesPage,
});

function MachineActions({ machine }: { machine: MachineSummary }) {
  const invalidateKeys = [["curio", "ClusterMachines"]];
  const cordonMutation = useCurioRpcMutation("Cordon", { invalidateKeys });
  const uncordonMutation = useCurioRpcMutation("Uncordon", { invalidateKeys });
  const restartMutation = useCurioRpcMutation("Restart", { invalidateKeys });

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {machine.Unschedulable ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          title="Uncordon"
          onClick={() => uncordonMutation.mutate([machine.ID])}
          disabled={uncordonMutation.isPending}
        >
          <Play className="size-3.5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          title="Cordon"
          onClick={() => cordonMutation.mutate([machine.ID])}
          disabled={cordonMutation.isPending}
        >
          <Pause className="size-3.5" />
        </Button>
      )}
      {machine.Unschedulable && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          title="Restart"
          onClick={() => restartMutation.mutate([machine.ID])}
          disabled={restartMutation.isPending}
        >
          <RotateCcw className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

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
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <MachineActions machine={row.original} />,
    size: 80,
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
