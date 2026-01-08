import { createFileRoute, Link } from "@tanstack/react-router";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/composed/status-badge";
import { KPICard } from "@/components/composed/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { MachineInfo } from "@/types/machine";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Server, Cpu, HardDrive } from "lucide-react";
import { formatBytes } from "@/utils/format";

export const Route = createFileRoute("/_app/machines/$id")({
  component: MachineDetailPage,
});

function MachineDetailPage() {
  const { id } = Route.useParams();
  const machineId = parseInt(id, 10);

  const { data, isLoading } = useCurioRpc<MachineInfo>(
    "ClusterNodeInfo",
    [machineId],
    { refetchInterval: 30_000 },
  );

  usePageTitle(data?.Info?.Name ?? `Machine #${machineId}`);

  if (isLoading && !data) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-[hsl(var(--muted-foreground))]">Machine not found.</p>
      </div>
    );
  }

  const info = data.Info;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link to="/machines">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 size-4" /> Back
          </Button>
        </Link>
        <Server className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">
          {info.Name || `Machine #${info.ID}`}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="CPU" value={info.CPU} subtitle="cores" />
        <KPICard
          label="Memory"
          value={formatBytes(info.Memory)}
        />
        <KPICard label="GPU" value={info.GPU} subtitle="units" />
        <KPICard label="Running Tasks" value={info.RunningTasks} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="size-4" /> Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[hsl(var(--muted-foreground))]">Host</dt>
                <dd className="font-mono">{info.Host}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[hsl(var(--muted-foreground))]">Layers</dt>
                <dd>{info.Layers || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[hsl(var(--muted-foreground))]">Tasks</dt>
                <dd>{info.Tasks || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[hsl(var(--muted-foreground))]">Unschedulable</dt>
                <dd>
                  <StatusBadge
                    status={info.Unschedulable ? "warning" : "done"}
                    label={info.Unschedulable ? "Yes" : "No"}
                  />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <StoragePanel storage={data.Storage} />
      </div>

      <RunningTasksPanel tasks={data.RunningTasks} />
      <FinishedTasksPanel tasks={data.FinishedTasks} />
    </div>
  );
}

function StoragePanel({ storage }: { storage: MachineInfo["Storage"] }) {
  if (!storage?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="size-4" /> Storage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {storage.map((s) => {
            const usedPercent = s.UsedPercent ?? 0;
            return (
              <div key={s.ID} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-mono text-xs">{s.ID}</span>
                  <span>{usedPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[hsl(var(--muted))]">
                  <div
                    className="h-full rounded-full bg-[hsl(var(--primary))]"
                    style={{ width: `${Math.min(usedPercent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span>
                    {formatBytes(s.Available)} free / {formatBytes(s.Capacity)}
                  </span>
                  <span>
                    {s.CanSeal && "Seal"} {s.CanStore && "Store"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const runningTaskCols: ColumnDef<MachineInfo["RunningTasks"][number]>[] = [
  { accessorKey: "ID", header: "ID" },
  { accessorKey: "Task", header: "Task" },
  { accessorKey: "Posted", header: "Posted" },
  {
    id: "sector",
    header: "Sector",
    cell: ({ row }) =>
      row.original.PoRepSector
        ? `${row.original.PoRepSectorMiner}:${row.original.PoRepSector}`
        : "—",
  },
];

function RunningTasksPanel({
  tasks,
}: {
  tasks: MachineInfo["RunningTasks"];
}) {
  if (!tasks?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Running Tasks ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable columns={runningTaskCols} data={tasks} emptyMessage="No running tasks" />
      </CardContent>
    </Card>
  );
}

const finishedTaskCols: ColumnDef<MachineInfo["FinishedTasks"][number]>[] = [
  { accessorKey: "ID", header: "ID" },
  { accessorKey: "Task", header: "Task" },
  { accessorKey: "Took", header: "Duration" },
  { accessorKey: "Queued", header: "Queued" },
  {
    id: "outcome",
    header: "Outcome",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.Outcome === "success" ? "done" : "failed"}
        label={row.original.Outcome}
      />
    ),
  },
  {
    accessorKey: "Message",
    header: "Message",
    cell: ({ row }) =>
      row.original.Message ? (
        <span className="max-w-xs truncate text-xs" title={row.original.Message}>
          {row.original.Message}
        </span>
      ) : (
        "—"
      ),
  },
];

function FinishedTasksPanel({
  tasks,
}: {
  tasks: MachineInfo["FinishedTasks"];
}) {
  if (!tasks?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finished Tasks ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={finishedTaskCols}
          data={tasks}
          emptyMessage="No finished tasks"
        />
      </CardContent>
    </Card>
  );
}
