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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import { DEFAULT_TASK_SEARCH } from "@/routes/_app/tasks/-module/search-state";
import type { MachineInfo } from "@/types/machine";
import { formatBytes } from "@/utils/format";
import {
  OFFLINE_THRESHOLD_SECONDS,
  parseDurationSeconds,
  splitCommaValues,
} from "./-module/machine-signals";

export const Route = createFileRoute("/_app/machines/$id")({
  component: MachineDetailPage,
});

type DetailActionType = "cordon" | "uncordon" | "restart" | "abort-restart";

interface PendingDetailAction {
  type: DetailActionType;
}

function MachineDetailPage() {
  const { id } = Route.useParams();
  const machineId = parseInt(id, 10);

  const {
    data,
    isLoading,
    refetch: refetchNodeInfo,
  } = useCurioRpc<MachineInfo>("ClusterNodeInfo", [machineId], {
    refetchInterval: 30_000,
  });

  const invalidateKeys = [
    ["curio", "ClusterNodeInfo"],
    ["curio", "ClusterNodeMetrics"],
    ["curio", "ClusterMachines"],
  ];
  const cordonMutation = useCurioRpcMutation("Cordon", {
    invalidateKeys,
  });
  const uncordonMutation = useCurioRpcMutation("Uncordon", {
    invalidateKeys,
  });
  const restartMutation = useCurioRpcMutation("Restart", {
    invalidateKeys,
  });
  const abortRestartMutation = useCurioRpcMutation("AbortRestart", {
    invalidateKeys,
  });

  const [pendingAction, setPendingAction] =
    useState<PendingDetailAction | null>(null);

  const { data: nodeMetrics, refetch: refetchNodeMetrics } =
    useCurioRpc<string>("ClusterNodeMetrics", [machineId], {
      refetchInterval: 60_000,
    });

  usePageTitle(data?.Info?.Name ?? `Machine #${machineId}`);

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
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
      <div className="py-2">
        <p className="text-muted-foreground">Machine not found.</p>
      </div>
    );
  }

  const info = data.Info;
  const layerItems = splitCommaValues(info.Layers ?? "");
  const taskItems = splitCommaValues(info.Tasks ?? "");
  const lastContactSeconds = parseDurationSeconds(info.LastContact ?? "");
  const storageHeartbeatErrors = data.Storage.filter((s) =>
    Boolean(s.HeartbeatErr),
  );
  const deadStorageUrls = (data.StorageURLs ?? []).filter((u) =>
    Boolean(u.LastDeadReason),
  );
  const machineAlerts: Array<{
    key: string;
    status: "failed" | "warning" | "pending";
    label: string;
  }> = [];
  if (
    lastContactSeconds !== null &&
    lastContactSeconds > OFFLINE_THRESHOLD_SECONDS
  ) {
    machineAlerts.push({
      key: "offline",
      status: "failed",
      label: `Offline (${info.LastContact})`,
    });
  }
  if (info.RestartRequest) {
    machineAlerts.push({
      key: "restart",
      status: "pending",
      label: "Restart Requested",
    });
  }
  if (deadStorageUrls.length > 0) {
    machineAlerts.push({
      key: "storage-url",
      status: "warning",
      label: `${deadStorageUrls.length} Dead Storage URL`,
    });
  }
  if (storageHeartbeatErrors.length > 0) {
    machineAlerts.push({
      key: "storage-heartbeat",
      status: "warning",
      label: `${storageHeartbeatErrors.length} Storage Heartbeat Errors`,
    });
  }

  const mutationPending =
    cordonMutation.isPending ||
    uncordonMutation.isPending ||
    restartMutation.isPending ||
    abortRestartMutation.isPending;

  const actionMeta = pendingAction
    ? {
        title:
          pendingAction.type === "cordon"
            ? "Confirm Cordon"
            : pendingAction.type === "uncordon"
              ? "Confirm Uncordon"
              : pendingAction.type === "restart"
                ? "Confirm Restart"
                : "Confirm Abort Restart",
        description:
          pendingAction.type === "cordon"
            ? "This machine will stop receiving new tasks."
            : pendingAction.type === "uncordon"
              ? "This machine will resume scheduling."
              : pendingAction.type === "restart"
                ? "This machine will receive a restart request."
                : "This will clear the pending restart request.",
        confirmLabel:
          pendingAction.type === "cordon"
            ? "Cordon"
            : pendingAction.type === "uncordon"
              ? "Uncordon"
              : pendingAction.type === "restart"
                ? "Restart"
                : "Abort Restart",
      }
    : null;

  const confirmAction = () => {
    if (!pendingAction) return;
    const idParam: [number] = [machineId];
    const onSuccess = () => {
      void Promise.all([refetchNodeInfo(), refetchNodeMetrics()]);
      setPendingAction(null);
    };
    if (pendingAction.type === "cordon") {
      cordonMutation.mutate(idParam, { onSuccess });
    }
    if (pendingAction.type === "uncordon") {
      uncordonMutation.mutate(idParam, { onSuccess });
    }
    if (pendingAction.type === "restart") {
      restartMutation.mutate(idParam, { onSuccess });
    }
    if (pendingAction.type === "abort-restart") {
      abortRestartMutation.mutate(idParam, { onSuccess });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/machines">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 size-4" /> Back
          </Button>
        </Link>
        <Server className="size-5" />
        <h2 className="text-2xl font-bold tracking-tight">
          {info.Name || `Machine #${info.ID}`}
        </h2>
        {info.Unschedulable && <Badge variant="destructive">Cordoned</Badge>}
      </div>

      {/* Machine Operations */}
      <div className="flex gap-2">
        {info.Unschedulable ? (
          <Button
            size="sm"
            onClick={() => setPendingAction({ type: "uncordon" })}
            disabled={mutationPending}
          >
            <Shield className="mr-1 size-4" />
            Uncordon
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPendingAction({ type: "cordon" })}
            disabled={mutationPending}
          >
            <ShieldOff className="mr-1 size-4" />
            Cordon
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPendingAction({ type: "restart" })}
          disabled={mutationPending}
        >
          <RotateCcw className="mr-1 size-4" /> Restart
        </Button>
        {info.RestartRequest ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPendingAction({ type: "abort-restart" })}
            disabled={mutationPending}
          >
            <XCircle className="mr-1 size-4" />
            Abort Restart
          </Button>
        ) : null}
      </div>

      {machineAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Machine Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {machineAlerts.map((alert) => (
                <StatusBadge
                  key={alert.key}
                  status={alert.status}
                  label={alert.label}
                />
              ))}
            </div>
            {deadStorageUrls[0]?.LastDeadReason ? (
              <p className="text-xs text-muted-foreground">
                Latest storage URL error: {deadStorageUrls[0].LastDeadReason}
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

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
                <dt className="text-muted-foreground">Host</dt>
                <dd className="font-mono">{info.Host}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Contact</dt>
                <dd>{info.LastContact || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Layers</dt>
                <dd className="max-w-[70%]">
                  {layerItems.length > 0 ? (
                    <div className="flex flex-wrap justify-end gap-1">
                      {layerItems.slice(0, 6).map((layer) => (
                        <Link key={`layer-${layer}`} to="/config">
                          <Badge
                            variant="outline"
                            title={`Open config and inspect layer: ${layer}`}
                          >
                            {layer}
                          </Badge>
                        </Link>
                      ))}
                      {layerItems.length > 6 ? (
                        <Badge variant="secondary">
                          +{layerItems.length - 6}
                        </Badge>
                      ) : null}
                    </div>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Tasks</dt>
                <dd className="max-w-[70%]">
                  {taskItems.length > 0 ? (
                    <div className="flex flex-wrap justify-end gap-1">
                      {taskItems.slice(0, 6).map((task) => (
                        <Link
                          key={`task-${task}`}
                          to="/tasks/analysis"
                          search={{ ...DEFAULT_TASK_SEARCH, taskType: task }}
                        >
                          <Badge variant="outline">{task}</Badge>
                        </Link>
                      ))}
                      {taskItems.length > 6 ? (
                        <Badge variant="secondary">
                          +{taskItems.length - 6}
                        </Badge>
                      ) : null}
                    </div>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              {info.Miners && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Miners</dt>
                  <dd>{info.Miners}</dd>
                </div>
              )}
              {info.StartupTime && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Startup Time</dt>
                  <dd>{new Date(info.StartupTime).toLocaleString()}</dd>
                </div>
              )}
              {info.RestartRequest && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Restart Requested</dt>
                  <dd>
                    <Badge variant="outline">
                      {new Date(info.RestartRequest).toLocaleString()}
                    </Badge>
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Unschedulable</dt>
                <dd>
                  <StatusBadge
                    status={info.Unschedulable ? "warning" : "done"}
                    label={info.Unschedulable ? "Yes" : "No"}
                  />
                </dd>
              </div>
              {info.Host && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Debug</dt>
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
                        className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
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
                  <tr className="border-b text-left text-muted-foreground">
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
                            className="text-destructive"
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
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 font-mono text-xs">
              {nodeMetrics}
            </pre>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionMeta?.title ?? "Confirm Action"}</DialogTitle>
            <DialogDescription>
              {actionMeta?.description} Machine: {info.Name || `#${info.ID}`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingAction(null)}
              disabled={mutationPending}
            >
              Cancel
            </Button>
            <Button onClick={confirmAction} disabled={mutationPending}>
              {mutationPending ? "Processing..." : actionMeta?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(usedPercent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {formatBytes(s.Available)} free / {formatBytes(s.Capacity)}
                  </span>
                  <span>
                    {s.CanSeal && "Seal"} {s.CanStore && "Store"}
                  </span>
                </div>
                {s.HeartbeatErr && (
                  <p className="text-xs text-destructive">⚠ {s.HeartbeatErr}</p>
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
  {
    accessorKey: "ID",
    header: "ID",
    cell: ({ row }) => (
      <Link
        to="/tasks/history"
        search={{
          ...DEFAULT_TASK_SEARCH,
          taskId: row.original.ID,
          taskType: row.original.Task,
        }}
        className="font-mono text-xs text-primary hover:underline"
      >
        {row.original.ID}
      </Link>
    ),
  },
  {
    accessorKey: "Task",
    header: "Task",
    cell: ({ row }) => (
      <Link
        to="/tasks/analysis"
        search={{ ...DEFAULT_TASK_SEARCH, taskType: row.original.Task }}
        className="text-primary hover:underline"
      >
        {row.original.Task}
      </Link>
    ),
  },
  { accessorKey: "Posted", header: "Posted" },
  { accessorKey: "UpdateTime", header: "Updated" },
  {
    id: "worker",
    header: "Worker",
    cell: ({ row }) => (
      <div className="space-y-0.5 text-xs">
        <Link
          to="/machines/$id"
          params={{ id: String(row.original.AddedBy) }}
          className="font-mono text-primary hover:underline"
        >
          {row.original.AddedBy}
        </Link>
        {row.original.InitiatedBy ? (
          <div className="text-muted-foreground">
            Init: {row.original.InitiatedBy}
          </div>
        ) : null}
      </div>
    ),
  },
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
      row.original.PoRepSector ? (
        <Link
          to="/sectors"
          className="font-mono text-primary hover:underline"
          title="Open sectors page"
        >
          {row.original.PoRepSectorMiner}:{row.original.PoRepSector}
        </Link>
      ) : (
        "—"
      ),
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
  {
    accessorKey: "ID",
    header: "ID",
    cell: ({ row }) => (
      <Link
        to="/tasks/history"
        search={{
          ...DEFAULT_TASK_SEARCH,
          taskId: row.original.TaskID ?? row.original.ID,
          taskType: row.original.Task,
        }}
        className="font-mono text-xs text-primary hover:underline"
      >
        {row.original.TaskID ?? row.original.ID}
      </Link>
    ),
  },
  {
    accessorKey: "Task",
    header: "Task",
    cell: ({ row }) => (
      <Link
        to="/tasks/analysis"
        search={{ ...DEFAULT_TASK_SEARCH, taskType: row.original.Task }}
        className="text-primary hover:underline"
      >
        {row.original.Task}
      </Link>
    ),
  },
  { accessorKey: "Posted", header: "Posted" },
  { accessorKey: "Start", header: "Start" },
  { accessorKey: "End", header: "End" },
  { accessorKey: "Took", header: "Duration" },
  { accessorKey: "Queued", header: "Queued" },
  {
    id: "outcome",
    header: "Outcome",
    cell: ({ row }) => {
      const success =
        row.original.Outcome?.toLowerCase() === "success" ||
        row.original.Result;
      return (
        <StatusBadge
          status={success ? "done" : "failed"}
          label={row.original.Outcome || (success ? "Success" : "Failed")}
        />
      );
    },
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
