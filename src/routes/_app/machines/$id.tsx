import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  Cpu,
  ExternalLink,
  Globe,
  HardDrive,
  RotateCcw,
  Server,
  Shield,
  ShieldOff,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import type { MachineInfo } from "@/types/machine";
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

  const cordonMutation = useCurioRpcMutation("Cordon", {
    invalidateKeys: [
      ["curio", "ClusterNodeInfo", machineId],
      ["curio", "ClusterMachines"],
    ],
  });
  const uncordonMutation = useCurioRpcMutation("Uncordon", {
    invalidateKeys: [
      ["curio", "ClusterNodeInfo", machineId],
      ["curio", "ClusterMachines"],
    ],
  });
  const restartMutation = useCurioRpcMutation("Restart", {
    invalidateKeys: [
      ["curio", "ClusterNodeInfo", machineId],
      ["curio", "ClusterMachines"],
    ],
  });
  const abortRestartMutation = useCurioRpcMutation("AbortRestart", {
    invalidateKeys: [
      ["curio", "ClusterNodeInfo", machineId],
      ["curio", "ClusterMachines"],
    ],
  });

  const [confirmRestart, setConfirmRestart] = useState(false);

  const { data: nodeMetrics } = useCurioRpc<string>(
    "ClusterNodeMetrics",
    [machineId],
    { refetchInterval: 60_000 },
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
        <p className="text-[hsl(var(--muted-foreground))]">
          Machine not found.
        </p>
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
        {info.Unschedulable && <Badge variant="destructive">Cordoned</Badge>}
      </div>

      {/* Machine Operations */}
      <div className="flex gap-2">
        {info.Unschedulable ? (
          <Button
            size="sm"
            onClick={() => uncordonMutation.mutate([machineId])}
            disabled={uncordonMutation.isPending}
          >
            <Shield className="mr-1 size-4" />
            {uncordonMutation.isPending ? "Uncordoning..." : "Uncordon"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => cordonMutation.mutate([machineId])}
            disabled={cordonMutation.isPending}
          >
            <ShieldOff className="mr-1 size-4" />
            {cordonMutation.isPending ? "Cordoning..." : "Cordon"}
          </Button>
        )}
        {confirmRestart ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--destructive))]">
              Confirm restart?
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                restartMutation.mutate([machineId]);
                setConfirmRestart(false);
              }}
              disabled={restartMutation.isPending}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmRestart(false)}
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmRestart(true)}
          >
            <RotateCcw className="mr-1 size-4" /> Restart
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => abortRestartMutation.mutate([machineId])}
          disabled={abortRestartMutation.isPending}
        >
          <XCircle className="mr-1 size-4" />
          {abortRestartMutation.isPending ? "Aborting..." : "Abort Restart"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="CPU" value={info.CPU} subtitle="cores" />
        <KPICard label="Memory" value={formatBytes(info.Memory)} />
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
                <dt className="text-[hsl(var(--muted-foreground))]">
                  Last Contact
                </dt>
                <dd>{info.LastContact || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[hsl(var(--muted-foreground))]">Layers</dt>
                <dd>{info.Layers || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[hsl(var(--muted-foreground))]">Tasks</dt>
                <dd>{info.Tasks || "—"}</dd>
              </div>
              {info.Miners && (
                <div className="flex justify-between">
                  <dt className="text-[hsl(var(--muted-foreground))]">
                    Miners
                  </dt>
                  <dd>{info.Miners}</dd>
                </div>
              )}
              {info.StartupTime && (
                <div className="flex justify-between">
                  <dt className="text-[hsl(var(--muted-foreground))]">
                    Startup Time
                  </dt>
                  <dd>{new Date(info.StartupTime).toLocaleString()}</dd>
                </div>
              )}
              {info.RestartRequest && (
                <div className="flex justify-between">
                  <dt className="text-[hsl(var(--muted-foreground))]">
                    Restart Requested
                  </dt>
                  <dd>
                    <Badge variant="outline">
                      {new Date(info.RestartRequest).toLocaleString()}
                    </Badge>
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[hsl(var(--muted-foreground))]">
                  Unschedulable
                </dt>
                <dd>
                  <StatusBadge
                    status={info.Unschedulable ? "warning" : "done"}
                    label={info.Unschedulable ? "Yes" : "No"}
                  />
                </dd>
              </div>
              {info.Host && (
                <div className="flex justify-between">
                  <dt className="text-[hsl(var(--muted-foreground))]">Debug</dt>
                  <dd className="flex gap-2">
                    {[
                      { label: "pprof", path: "/debug/pprof" },
                      { label: "metrics", path: "/debug/metrics" },
                      { label: "vars", path: "/debug/vars" },
                    ].map((link) => (
                      <a
                        key={link.path}
                        href={`http://${info.Host}${link.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-xs text-[hsl(var(--primary))] hover:underline"
                      >
                        {link.label}
                        <ExternalLink className="size-3" />
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <StoragePanel storage={data.Storage} />
      </div>

      {data.StorageURLs && data.StorageURLs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-4" /> Storage URL Liveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-[hsl(var(--muted-foreground))]">
                    <th className="pb-2 pr-4">Storage ID</th>
                    <th className="pb-2 pr-4">URL</th>
                    <th className="pb-2 pr-4">Last Checked</th>
                    <th className="pb-2 pr-4">Last Live</th>
                    <th className="pb-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.StorageURLs.map((u, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5 pr-4 font-mono">
                        {u.StorageID.slice(0, 8)}…
                      </td>
                      <td className="py-1.5 pr-4 font-mono">{u.URL}</td>
                      <td className="py-1.5 pr-4">
                        {u.LastChecked
                          ? new Date(u.LastChecked).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-1.5 pr-4">
                        {u.LastLive
                          ? new Date(u.LastLive).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-1.5">
                        {u.LastDeadReason ? (
                          <span
                            className="text-[hsl(var(--destructive))]"
                            title={u.LastDeadReason}
                          >
                            Dead: {u.LastDeadReason.slice(0, 40)}
                          </span>
                        ) : (
                          <StatusBadge status="done" label="Live" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <RunningTasksPanel tasks={data.RunningTasks} />
      <FinishedTasksPanel tasks={data.FinishedTasks} />

      {nodeMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Node Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-[hsl(var(--muted))] p-3 font-mono text-xs">
              {nodeMetrics}
            </pre>
          </CardContent>
        </Card>
      )}
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
        <div className="space-y-4">
          {storage.map((s) => {
            const usedPercent = s.UsedPercent ?? 0;
            return (
              <div
                key={s.ID}
                className="space-y-1.5 border-b pb-3 last:border-0"
              >
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
                {s.HeartbeatErr && (
                  <p className="text-xs text-[hsl(var(--destructive))]">
                    ⚠ {s.HeartbeatErr}
                  </p>
                )}
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
  { accessorKey: "UpdateTime", header: "Updated" },
  {
    accessorKey: "Retries",
    header: "Retries",
    cell: ({ row }) =>
      row.original.Retries > 0 ? (
        <Badge variant="outline">{row.original.Retries}</Badge>
      ) : (
        "0"
      ),
  },
  {
    id: "sector",
    header: "Sector",
    cell: ({ row }) =>
      row.original.PoRepSector
        ? `${row.original.PoRepSectorMiner}:${row.original.PoRepSector}`
        : "—",
  },
];

function RunningTasksPanel({ tasks }: { tasks: MachineInfo["RunningTasks"] }) {
  if (!tasks?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Running Tasks ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={runningTaskCols}
          data={tasks}
          emptyMessage="No running tasks"
        />
      </CardContent>
    </Card>
  );
}

const finishedTaskCols: ColumnDef<MachineInfo["FinishedTasks"][number]>[] = [
  { accessorKey: "ID", header: "ID" },
  { accessorKey: "Task", header: "Task" },
  { accessorKey: "Posted", header: "Posted" },
  { accessorKey: "Start", header: "Start" },
  { accessorKey: "End", header: "End" },
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
        <span
          className="max-w-xs truncate text-xs"
          title={row.original.Message}
        >
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
