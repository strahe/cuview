import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import { cn } from "@/lib/utils";
import { DEFAULT_TASK_SEARCH } from "@/routes/_app/tasks/-module/search-state";
import type { MachineSummary } from "@/types/machine";
import { getMachineSignals, splitCommaValues } from "./-module/machine-signals";

export const Route = createFileRoute("/_app/machines/")({
  component: MachinesPage,
});

type RuntimeFilter = "all" | "online" | "offline";
type SchedulingFilter = "all" | "schedulable" | "cordoned";
type RestartFilter = "all" | "requested" | "restarting";
type MachineActionType = "cordon" | "uncordon" | "restart";

interface FilterOption<TValue extends string> {
  value: TValue;
  label: string;
}

interface PendingAction {
  type: MachineActionType;
  machine: MachineSummary;
}

const runtimeFilterOptions: FilterOption<RuntimeFilter>[] = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

const schedulingFilterOptions: FilterOption<SchedulingFilter>[] = [
  { value: "all", label: "All" },
  { value: "schedulable", label: "Schedulable" },
  { value: "cordoned", label: "Cordoned" },
];

const restartFilterOptions: FilterOption<RestartFilter>[] = [
  { value: "all", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "restarting", label: "Restarting" },
];

function MachineActions({
  machine,
  disabled,
  onAction,
}: {
  machine: MachineSummary;
  disabled?: boolean;
  onAction: (type: MachineActionType, machine: MachineSummary) => void;
}) {
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
          aria-label="Uncordon"
          onClick={() => onAction("uncordon", machine)}
          disabled={disabled}
        >
          <Play className="size-3.5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          title="Cordon"
          aria-label="Cordon"
          onClick={() => onAction("cordon", machine)}
          disabled={disabled}
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
          aria-label="Restart"
          onClick={() => onAction("restart", machine)}
          disabled={disabled}
        >
          <RotateCcw className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

const createColumns = (
  showDetailed: boolean,
  options: {
    disabled?: boolean;
    onAction: (type: MachineActionType, machine: MachineSummary) => void;
  },
): ColumnDef<MachineSummary>[] => [
  {
    accessorKey: "ID",
    header: "ID",
  },
  {
    accessorKey: "Name",
    header: "Name",
    cell: ({ row }) => {
      const signals = getMachineSignals(row.original);
      return (
        <Link
          to="/machines/$id"
          params={{ id: String(row.original.ID) }}
          className={cn(
            "font-medium text-primary hover:underline",
            signals.hasAlert && "text-destructive",
          )}
        >
          {row.original.Name || `Machine #${row.original.ID}`}
        </Link>
      );
    },
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
  ...(showDetailed
    ? ([
        {
          id: "taskTypes",
          header: "Task Types",
          cell: ({ row }) => {
            const tasks = splitCommaValues(row.original.Tasks ?? "");
            if (tasks.length === 0) {
              return <span className="text-xs text-muted-foreground">-</span>;
            }
            const visible = tasks.slice(0, 2);
            return (
              <div className="flex flex-wrap gap-1">
                {visible.map((task) => (
                  <Link
                    key={`${row.original.ID}-task-${task}`}
                    to="/tasks/analysis"
                    search={{ ...DEFAULT_TASK_SEARCH, taskType: task }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:border-primary/50"
                    >
                      {task}
                    </Badge>
                  </Link>
                ))}
                {tasks.length > visible.length ? (
                  <Badge variant="secondary">
                    +{tasks.length - visible.length}
                  </Badge>
                ) : null}
              </div>
            );
          },
        },
        {
          id: "layers",
          header: "Layers",
          cell: ({ row }) => {
            const layers = splitCommaValues(row.original.Layers ?? "");
            if (layers.length === 0) {
              return <span className="text-xs text-muted-foreground">-</span>;
            }
            const visible = layers.slice(0, 2);
            return (
              <div className="flex flex-wrap gap-1">
                {visible.map((layer) => (
                  <Link
                    key={`${row.original.ID}-layer-${layer}`}
                    to="/config"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:border-primary/50"
                      title={`Open config and inspect layer: ${layer}`}
                    >
                      {layer}
                    </Badge>
                  </Link>
                ))}
                {layers.length > visible.length ? (
                  <Badge variant="secondary">
                    +{layers.length - visible.length}
                  </Badge>
                ) : null}
              </div>
            );
          },
        },
      ] satisfies ColumnDef<MachineSummary>[])
    : []),
  {
    accessorKey: "SinceContact",
    header: "Last Contact",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const signals = getMachineSignals(row.original);
      if (signals.restarting) {
        return <StatusBadge status="running" label="Restarting" />;
      }
      if (signals.restartPending) {
        return <StatusBadge status="pending" label="Restart Pending" />;
      }
      if (signals.unschedulable) {
        const label =
          row.original.RunningTasks > 0
            ? `Cordoned (${row.original.RunningTasks})`
            : "Cordoned";
        return <StatusBadge status="warning" label={label} />;
      }
      if (signals.offline) {
        return <StatusBadge status="failed" label="Offline" />;
      }
      return <StatusBadge status="done" label="Online" />;
    },
  },
  {
    id: "alerts",
    header: "Alerts",
    cell: ({ row }) => {
      const signals = getMachineSignals(row.original);
      const badges: Array<{
        status: "failed" | "warning" | "running";
        label: string;
      }> = [];
      if (signals.offline) badges.push({ status: "failed", label: "Offline" });
      if (signals.unschedulable)
        badges.push({ status: "warning", label: "Cordoned" });
      if (signals.restarting)
        badges.push({ status: "running", label: "Restarting" });
      if (badges.length === 0) {
        return <span className="text-xs text-muted-foreground">-</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {badges.map((badge) => (
            <StatusBadge
              key={`${row.original.ID}-${badge.label}`}
              status={badge.status}
              label={badge.label}
              className="text-[11px]"
            />
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <MachineActions
        machine={row.original}
        disabled={options.disabled}
        onAction={options.onAction}
      />
    ),
    size: 80,
  },
];

function CompactFilterGroup<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: TValue;
  options: FilterOption<TValue>[];
  onChange: (value: TValue) => void;
}) {
  return (
    <fieldset
      aria-label={`${label} filter`}
      className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/90 p-1"
    >
      <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <ToggleGroup
        multiple={false}
        value={[value]}
        onValueChange={(nextValues) => {
          const nextValue = nextValues[0];
          if (nextValue) onChange(nextValue as TValue);
        }}
        variant="outline"
        size="sm"
        spacing={0}
      >
        {options.map((option) => {
          return (
            <ToggleGroupItem
              key={`${label}-${option.value}`}
              value={option.value}
              aria-label={`${label}: ${option.label}`}
              className="h-7 min-w-0 px-2 text-xs"
            >
              {option.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </fieldset>
  );
}

function MachinesPage() {
  usePageTitle("Machines");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [runtimeFilter, setRuntimeFilter] = useState<RuntimeFilter>("all");
  const [schedulingFilter, setSchedulingFilter] =
    useState<SchedulingFilter>("all");
  const [restartFilter, setRestartFilter] = useState<RestartFilter>("all");
  const [showDetailed, setShowDetailed] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const { data, isLoading, refetch } = useCurioRpc<MachineSummary[]>(
    "ClusterMachines",
    [],
    { refetchInterval: 5_000 },
  );

  const machines = data ?? [];
  const invalidateKeys = [
    ["curio", "ClusterMachines"],
    ["curio", "ClusterNodeInfo"],
  ];
  const cordonMutation = useCurioRpcMutation("Cordon", { invalidateKeys });
  const uncordonMutation = useCurioRpcMutation("Uncordon", { invalidateKeys });
  const restartMutation = useCurioRpcMutation("Restart", { invalidateKeys });
  const mutationPending =
    cordonMutation.isPending ||
    uncordonMutation.isPending ||
    restartMutation.isPending;

  const openActionConfirm = useCallback(
    (type: MachineActionType, machine: MachineSummary) => {
      setPendingAction({ type, machine });
    },
    [],
  );

  const columns = useMemo(
    () =>
      createColumns(showDetailed, {
        disabled: mutationPending,
        onAction: openActionConfirm,
      }),
    [showDetailed, mutationPending, openActionConfirm],
  );

  const stats = useMemo(() => {
    const total = machines.length;
    const online = machines.filter((m) => getMachineSignals(m).online).length;
    const unschedulable = machines.filter((m) => m.Unschedulable).length;
    const offline = machines.filter((m) => getMachineSignals(m).offline).length;
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

  const runtimeSummary = useMemo(
    () => [
      {
        label: "Online",
        value: stats.online,
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      },
      {
        label: "Offline",
        value: stats.offline,
        className: "border-destructive/30 bg-destructive/10 text-destructive",
      },
      {
        label: "Cordoned",
        value: stats.unschedulable,
        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
    ],
    [stats.online, stats.offline, stats.unschedulable],
  );

  const capacitySummary = useMemo(
    () => [
      { label: "Running Tasks", value: stats.totalTasks },
      { label: "Total CPU", value: stats.totalCpu, unit: "cores" },
      { label: "Total GPU", value: stats.totalGpu, unit: "units" },
    ],
    [stats.totalTasks, stats.totalCpu, stats.totalGpu],
  );

  const filteredMachines = useMemo(() => {
    const queryValue = query.trim().toLowerCase();

    return machines.filter((machine) => {
      const signals = getMachineSignals(machine);

      if (runtimeFilter === "online" && !signals.online) return false;
      if (runtimeFilter === "offline" && !signals.offline) return false;

      if (schedulingFilter === "schedulable" && signals.unschedulable) {
        return false;
      }
      if (schedulingFilter === "cordoned" && !signals.unschedulable) {
        return false;
      }

      if (
        restartFilter === "requested" &&
        !(signals.restarting || signals.restartPending)
      ) {
        return false;
      }
      if (restartFilter === "restarting" && !signals.restarting) {
        return false;
      }

      if (!queryValue) return true;

      const tokens = [
        machine.Name,
        machine.Address,
        String(machine.ID),
        machine.SinceContact,
        ...splitCommaValues(machine.Tasks ?? ""),
        ...splitCommaValues(machine.Layers ?? ""),
      ]
        .filter(Boolean)
        .map((entry) => entry.toLowerCase());

      return tokens.some((entry) => entry.includes(queryValue));
    });
  }, [machines, query, runtimeFilter, schedulingFilter, restartFilter]);

  const isFilterActive =
    query.trim().length > 0 ||
    runtimeFilter !== "all" ||
    schedulingFilter !== "all" ||
    restartFilter !== "all";

  const controls = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-72 md:w-80">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search machines..."
            className="h-8"
            aria-label="Search machines"
          />
        </div>

        <CompactFilterGroup
          label="Runtime"
          value={runtimeFilter}
          options={runtimeFilterOptions}
          onChange={setRuntimeFilter}
        />
        <CompactFilterGroup
          label="Scheduling"
          value={schedulingFilter}
          options={schedulingFilterOptions}
          onChange={setSchedulingFilter}
        />
        <CompactFilterGroup
          label="Restart"
          value={restartFilter}
          options={restartFilterOptions}
          onChange={setRestartFilter}
        />

        <Toggle
          variant="outline"
          size="sm"
          pressed={showDetailed}
          onPressedChange={setShowDetailed}
          className="h-8"
        >
          Detailed View
        </Toggle>

        <div className="flex w-full items-center justify-between gap-2 text-xs text-muted-foreground sm:ml-auto sm:w-auto sm:justify-end">
          <span>
            Showing {filteredMachines.length}/{machines.length} machines
          </span>
          {isFilterActive ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                setQuery("");
                setRuntimeFilter("all");
                setSchedulingFilter("all");
                setRestartFilter("all");
              }}
            >
              Reset Filters
            </Button>
          ) : null}
        </div>
      </div>
    ),
    [
      query,
      runtimeFilter,
      schedulingFilter,
      restartFilter,
      showDetailed,
      filteredMachines.length,
      machines.length,
      isFilterActive,
    ],
  );

  const actionMeta = pendingAction
    ? {
        title:
          pendingAction.type === "cordon"
            ? "Confirm Cordon"
            : pendingAction.type === "uncordon"
              ? "Confirm Uncordon"
              : "Confirm Restart",
        description:
          pendingAction.type === "cordon"
            ? "This machine will stop receiving new tasks."
            : pendingAction.type === "uncordon"
              ? "This machine will resume scheduling."
              : "This machine will receive a restart request.",
        confirmLabel:
          pendingAction.type === "cordon"
            ? "Cordon"
            : pendingAction.type === "uncordon"
              ? "Uncordon"
              : "Restart",
      }
    : null;

  const confirmAction = useCallback(() => {
    if (!pendingAction) return;
    const idParam: [number] = [pendingAction.machine.ID];
    const onSuccess = () => {
      void refetch();
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
  }, [
    pendingAction,
    cordonMutation,
    uncordonMutation,
    restartMutation,
    refetch,
  ]);

  return (
    <>
      <div className="space-y-4">
        {machines.length > 0 && (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Card className="shadow-none">
              <CardContent className="px-4 py-3">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Total Machines
                      </p>
                      <p className="mt-0.5 text-2xl font-semibold leading-none tabular-nums">
                        {stats.total}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {runtimeSummary.map((item) => (
                        <Badge
                          key={`runtime-${item.label}`}
                          variant="outline"
                          className={item.className}
                        >
                          {item.label} {item.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Healthy ratio:{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {stats.total > 0
                          ? Math.round((stats.online / stats.total) * 100)
                          : 0}
                        %
                      </span>
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      Restart pending and restarting are tracked below.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardContent className="grid grid-cols-3 gap-2 px-4 py-3">
                {capacitySummary.map((item) => (
                  <div
                    key={`capacity-${item.label}`}
                    className="rounded-md border border-border/60 bg-background/70 px-2.5 py-2"
                  >
                    <p className="text-[11px] text-muted-foreground">
                      {item.label}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-lg font-semibold leading-none tabular-nums">
                        {item.value}
                      </span>
                      {item.unit ? (
                        <span className="text-[11px] text-muted-foreground">
                          {item.unit}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Machine Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">{controls}</div>
            <DataTable
              columns={columns}
              data={filteredMachines}
              loading={isLoading}
              emptyMessage={
                machines.length
                  ? "No machines match current filters"
                  : "No machines found"
              }
              onRowClick={(row) =>
                navigate({
                  to: "/machines/$id",
                  params: { id: String(row.ID) },
                })
              }
            />
          </CardContent>
        </Card>
      </div>

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
              {actionMeta?.description}{" "}
              {pendingAction
                ? `Machine: ${pendingAction.machine.Name || `#${pendingAction.machine.ID}`}`
                : ""}
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
    </>
  );
}
