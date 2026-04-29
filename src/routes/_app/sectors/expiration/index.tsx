import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/composed/form";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";

export const Route = createFileRoute("/_app/sectors/expiration/")({
  component: ExpirationPage,
});

interface ExpBucket {
  less_than_days: number;
}

interface ExpPreset {
  name: string;
  action_type: string;
  info_bucket_above_days: number;
  info_bucket_below_days: number;
  target_expiration_days: number | null;
  max_candidate_days: number | null;
  top_up_count_low_water_mark: number | null;
  top_up_count_high_water_mark: number | null;
  cc: boolean | null;
  drop_claims: boolean;
}

interface ExpSPAssignment {
  sp_id: number;
  sp_address: string;
  preset_name: string;
  enabled: boolean;
  last_run_at: string | null;
  last_message_cid: string | null;
  last_message_landed_at: string | null;
}

interface ExpBucketCount {
  sp_id: number;
  sp_address: string;
  less_than_days: number;
  total_count: number;
  cc_count: number;
  deal_count: number;
}

type ExpActionType = "extend" | "top_up";

function isSupportedActionType(
  actionType: string,
): actionType is ExpActionType {
  return actionType === "extend" || actionType === "top_up";
}

function normalizeActionType(actionType: string): ExpActionType {
  return actionType === "top_up" ? "top_up" : "extend";
}

function parseOptionalInt(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function isTopUpPresetValid(preset: ExpPreset) {
  if (normalizeActionType(preset.action_type) !== "top_up") {
    return true;
  }

  const low = preset.top_up_count_low_water_mark;
  const high = preset.top_up_count_high_water_mark;
  return low != null && high != null && high >= low;
}

function toPresetPayload(preset: ExpPreset): ExpPreset {
  const actionType = normalizeActionType(preset.action_type);
  const isTopUp = actionType === "top_up";

  return {
    ...preset,
    action_type: actionType,
    target_expiration_days: isTopUp ? null : preset.target_expiration_days,
    max_candidate_days: isTopUp ? null : preset.max_candidate_days,
    top_up_count_low_water_mark: isTopUp
      ? preset.top_up_count_low_water_mark
      : null,
    top_up_count_high_water_mark: isTopUp
      ? preset.top_up_count_high_water_mark
      : null,
  };
}

function getAssignmentStatus(assignment: ExpSPAssignment) {
  if (!assignment.enabled) {
    return { status: "warning" as const, label: "Disabled" };
  }
  if (!assignment.last_run_at) {
    return { status: "warning" as const, label: "Needs Action" };
  }
  if (assignment.last_message_cid && assignment.last_message_landed_at) {
    return { status: "done" as const, label: "OK" };
  }
  if (assignment.last_message_cid && !assignment.last_message_landed_at) {
    return { status: "pending" as const, label: "Pending" };
  }
  if (assignment.last_run_at && !assignment.last_message_cid) {
    return { status: "done" as const, label: "Idle" };
  }
  return { status: "error" as const, label: "Error" };
}

const bucketInvalidate = [["curio", "SectorExpBuckets"]];
const presetInvalidate = [["curio", "SectorExpManagerPresets"]];
const spInvalidate = [["curio", "SectorExpManagerSPs"]];

function ExpirationPage() {
  const [tab, setTab] = useState("buckets");

  const { data: buckets, isLoading: bucketsLoading } = useCurioRpc<ExpBucket[]>(
    "SectorExpBuckets",
    [],
    { refetchInterval: 60_000 },
  );
  const { data: presets, isLoading: presetsLoading } = useCurioRpc<ExpPreset[]>(
    "SectorExpManagerPresets",
    [],
    { refetchInterval: 60_000 },
  );
  const { data: spAssignments, isLoading: spsLoading } = useCurioRpc<
    ExpSPAssignment[]
  >("SectorExpManagerSPs", [], { refetchInterval: 60_000 });
  const { data: bucketCounts } = useCurioRpc<ExpBucketCount[]>(
    "SectorExpBucketCounts",
    [],
    { refetchInterval: 60_000 },
  );

  // Bucket mutations
  const addBucketMutation = useCurioRpcMutation("SectorExpBucketAdd", {
    invalidateKeys: bucketInvalidate,
  });
  const deleteBucketMutation = useCurioRpcMutation("SectorExpBucketDelete", {
    invalidateKeys: bucketInvalidate,
  });

  // Preset mutations
  const addPresetMutation = useCurioRpcMutation("SectorExpManagerPresetAdd", {
    invalidateKeys: presetInvalidate,
  });
  const deletePresetMutation = useCurioRpcMutation(
    "SectorExpManagerPresetDelete",
    { invalidateKeys: presetInvalidate },
  );
  const updatePresetMutation = useCurioRpcMutation(
    "SectorExpManagerPresetUpdate",
    { invalidateKeys: presetInvalidate },
  );

  // SP mutations
  const addSPMutation = useCurioRpcMutation("SectorExpManagerSPAdd", {
    invalidateKeys: spInvalidate,
  });
  const removeSPMutation = useCurioRpcMutation("SectorExpManagerSPDelete", {
    invalidateKeys: spInvalidate,
  });
  const toggleSPMutation = useCurioRpcMutation("SectorExpManagerSPToggle", {
    invalidateKeys: spInvalidate,
  });
  const evalConditionMutation = useCurioRpcMutation<boolean>(
    "SectorExpManagerSPEvalCondition",
  );

  // Bucket state
  const [showAddBucket, setShowAddBucket] = useState(false);
  const [newBucketDays, setNewBucketDays] = useState("30");
  const [confirmDeleteBucket, setConfirmDeleteBucket] = useState<number | null>(
    null,
  );

  // Preset state
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [presetForm, setPresetForm] = useState<ExpPreset>({
    name: "",
    action_type: "extend",
    info_bucket_above_days: 0,
    info_bucket_below_days: 365,
    target_expiration_days: null,
    max_candidate_days: null,
    top_up_count_low_water_mark: null,
    top_up_count_high_water_mark: null,
    cc: null,
    drop_claims: false,
  });
  const [confirmDeletePreset, setConfirmDeletePreset] = useState<string | null>(
    null,
  );

  // SP state
  const [showAddSP, setShowAddSP] = useState(false);
  const [spForm, setSPForm] = useState({ sp: "", preset: "" });
  const [confirmRemoveSP, setConfirmRemoveSP] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<{
    key: string;
    result: boolean | null;
  } | null>(null);
  const [editPreset, setEditPreset] = useState<ExpPreset | null>(null);

  const handleAddBucket = useCallback(() => {
    const d = parseInt(newBucketDays, 10);
    if (d > 0) {
      addBucketMutation.mutate([d]);
      setShowAddBucket(false);
      setNewBucketDays("30");
    }
  }, [newBucketDays, addBucketMutation]);

  const handleAddPreset = useCallback(() => {
    const payload = toPresetPayload(presetForm);
    if (!payload.name.trim() || !isTopUpPresetValid(payload)) return;
    addPresetMutation.mutate([payload]);
    setShowAddPreset(false);
  }, [presetForm, addPresetMutation]);

  const handleAddSP = useCallback(() => {
    if (!spForm.sp.trim() || !spForm.preset.trim()) return;
    addSPMutation.mutate([spForm.sp.trim(), spForm.preset.trim()]);
    setShowAddSP(false);
    setSPForm({ sp: "", preset: "" });
  }, [spForm, addSPMutation]);

  // Bucket columns
  const bucketColumns: ColumnDef<ExpBucket>[] = [
    { accessorKey: "less_than_days", header: "Less Than (days)" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const d = row.original.less_than_days;
        if (confirmDeleteBucket === d) {
          return (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  deleteBucketMutation.mutate([d]);
                  setConfirmDeleteBucket(null);
                }}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDeleteBucket(null)}
              >
                ×
              </Button>
            </div>
          );
        }
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmDeleteBucket(d)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        );
      },
    },
  ];

  // Preset columns
  const presetColumns: ColumnDef<ExpPreset>[] = [
    { accessorKey: "name", header: "Name" },
    {
      id: "action_type",
      header: "Action",
      cell: ({ row }) => {
        const rawActionType = row.original.action_type;
        const actionType = normalizeActionType(rawActionType);
        const hasLegacyAction = !isSupportedActionType(rawActionType);

        if (hasLegacyAction) {
          return (
            <div className="space-y-1">
              <StatusBadge
                status="warning"
                label={`Legacy: ${rawActionType}`}
              />
              <div className="text-xs text-muted-foreground">
                Unsupported by Curio expmgr runtime.
              </div>
            </div>
          );
        }

        if (actionType === "top_up") {
          return (
            <div className="space-y-1">
              <StatusBadge status="info" label="Top-up" />
              <div className="text-xs text-muted-foreground">
                Low {row.original.top_up_count_low_water_mark ?? "—"} / High{" "}
                {row.original.top_up_count_high_water_mark ?? "—"}
              </div>
            </div>
          );
        }

        return <StatusBadge status="done" label="Extend" />;
      },
    },
    { accessorKey: "info_bucket_above_days", header: "Above (days)" },
    { accessorKey: "info_bucket_below_days", header: "Below (days)" },
    {
      id: "target_candidate",
      header: "Target / Max",
      cell: ({ row }) => {
        if (!isSupportedActionType(row.original.action_type)) {
          return "Legacy";
        }

        const actionType = normalizeActionType(row.original.action_type);
        if (actionType === "top_up") return "—";

        return `${row.original.target_expiration_days ?? "—"} / ${row.original.max_candidate_days ?? "—"}`;
      },
    },
    {
      id: "cc",
      header: "CC Filter",
      cell: ({ row }) =>
        row.original.cc == null
          ? "All"
          : row.original.cc
            ? "CC only"
            : "Deal only",
    },
    {
      accessorKey: "drop_claims",
      header: "Drop Claims",
      cell: ({ row }) => (row.original.drop_claims ? "Yes" : "No"),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const n = row.original.name;
        if (confirmDeletePreset === n) {
          return (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  deletePresetMutation.mutate([n]);
                  setConfirmDeletePreset(null);
                }}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDeletePreset(null)}
              >
                ×
              </Button>
            </div>
          );
        }
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditPreset(row.original)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDeletePreset(n)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  // SP columns
  const spColumns: ColumnDef<ExpSPAssignment>[] = [
    {
      accessorKey: "sp_address",
      header: "SP",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.sp_address}</span>
      ),
    },
    { accessorKey: "preset_name", header: "Preset" },
    {
      id: "enabled",
      header: "Status",
      cell: ({ row }) => {
        const status = getAssignmentStatus(row.original);
        return <StatusBadge status={status.status} label={status.label} />;
      },
    },
    {
      accessorKey: "last_run_at",
      header: "Last Run",
      cell: ({ row }) => row.original.last_run_at || "—",
    },
    {
      id: "last_message",
      header: "Message",
      cell: ({ row }) => (
        <div className="max-w-[260px] space-y-0.5 text-xs">
          {row.original.last_message_cid ? (
            <div className="truncate font-mono">
              {row.original.last_message_cid}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {row.original.last_message_landed_at && (
            <div className="text-muted-foreground">
              Landed: {row.original.last_message_landed_at}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const key = `${row.original.sp_address}:${row.original.preset_name}`;
        if (confirmRemoveSP === key) {
          return (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  removeSPMutation.mutate([
                    row.original.sp_address,
                    row.original.preset_name,
                  ]);
                  setConfirmRemoveSP(null);
                }}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmRemoveSP(null)}
              >
                ×
              </Button>
            </div>
          );
        }
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                toggleSPMutation.mutate([
                  row.original.sp_address,
                  row.original.preset_name,
                  !row.original.enabled,
                ])
              }
            >
              {row.original.enabled ? "Disable" : "Enable"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                evalConditionMutation.mutate(
                  [row.original.sp_address, row.original.preset_name],
                  {
                    onSuccess: (result) => setEvalResult({ key, result }),
                  },
                )
              }
              disabled={evalConditionMutation.isPending}
            >
              Eval
            </Button>
            {evalResult?.key === key && evalResult.result !== null && (
              <StatusBadge
                status={evalResult.result ? "done" : "warning"}
                label={evalResult.result ? "Match" : "No Match"}
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmRemoveSP(key)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "buckets" | "presets" | "sps")}
      >
        <TabsList>
          <TabsTrigger value="buckets">Expiration Buckets</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="sps">SP Assignments</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          {tab === "buckets" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Expiration Buckets</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddBucket(true)}
                >
                  <Plus data-icon="inline-start" /> Add Bucket
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <DataTable
                  columns={bucketColumns}
                  data={buckets ?? []}
                  loading={bucketsLoading}
                  emptyMessage="No expiration buckets"
                />
                {bucketCounts && bucketCounts.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">
                      Bucket Sector Counts
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SP</TableHead>
                          <TableHead className="text-right">
                            {"< Days"}
                          </TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">CC</TableHead>
                          <TableHead className="text-right">Deal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bucketCounts.map((bc, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono">
                              {bc.sp_address}
                            </TableCell>
                            <TableCell className="text-right">
                              {bc.less_than_days}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {bc.total_count}
                            </TableCell>
                            <TableCell className="text-right">
                              {bc.cc_count}
                            </TableCell>
                            <TableCell className="text-right">
                              {bc.deal_count}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {tab === "presets" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Expiration Manager Presets</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddPreset(true)}
                >
                  <Plus data-icon="inline-start" /> Add Preset
                </Button>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={presetColumns}
                  data={presets ?? []}
                  loading={presetsLoading}
                  emptyMessage="No presets"
                />
              </CardContent>
            </Card>
          )}

          {tab === "sps" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>SP Assignments</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddSP(true)}
                >
                  <Plus data-icon="inline-start" /> Add Assignment
                </Button>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={spColumns}
                  data={spAssignments ?? []}
                  loading={spsLoading}
                  emptyMessage="No SP assignments"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </Tabs>

      {/* Add Bucket Dialog */}
      {showAddBucket && (
        <Dialog open onOpenChange={() => setShowAddBucket(false)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Expiration Bucket</DialogTitle>
            </DialogHeader>
            <Field>
              <FieldLabel>Less Than (days) *</FieldLabel>
              <Input
                type="number"
                value={newBucketDays}
                onChange={(e) => setNewBucketDays(e.target.value)}
              />
            </Field>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddBucket(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddBucket}
                disabled={addBucketMutation.isPending}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Preset Dialog */}
      {showAddPreset && (
        <Dialog open onOpenChange={() => setShowAddPreset(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Expiration Preset</DialogTitle>
            </DialogHeader>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel>Name *</FieldLabel>
                <Input
                  value={presetForm.name}
                  onChange={(e) =>
                    setPresetForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Preset name"
                />
              </Field>
              <Field>
                <FieldLabel>Action Type</FieldLabel>
                <Select
                  value={normalizeActionType(presetForm.action_type)}
                  onValueChange={(value) =>
                    setPresetForm((f) => ({
                      ...f,
                      action_type: value ?? "extend",
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="extend">Extend</SelectItem>
                      <SelectItem value="top_up">Top-up</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Above Days</FieldLabel>
                  <Input
                    type="number"
                    value={presetForm.info_bucket_above_days}
                    onChange={(e) =>
                      setPresetForm((f) => ({
                        ...f,
                        info_bucket_above_days:
                          Number.parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Below Days</FieldLabel>
                  <Input
                    type="number"
                    value={presetForm.info_bucket_below_days}
                    onChange={(e) =>
                      setPresetForm((f) => ({
                        ...f,
                        info_bucket_below_days:
                          Number.parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                </Field>
              </div>

              {normalizeActionType(presetForm.action_type) === "top_up" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Low Water Mark</FieldLabel>
                    <Input
                      type="number"
                      value={presetForm.top_up_count_low_water_mark ?? ""}
                      onChange={(e) =>
                        setPresetForm((f) => ({
                          ...f,
                          top_up_count_low_water_mark: parseOptionalInt(
                            e.target.value,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>High Water Mark</FieldLabel>
                    <Input
                      type="number"
                      value={presetForm.top_up_count_high_water_mark ?? ""}
                      onChange={(e) =>
                        setPresetForm((f) => ({
                          ...f,
                          top_up_count_high_water_mark: parseOptionalInt(
                            e.target.value,
                          ),
                        }))
                      }
                    />
                  </Field>
                </div>
              )}

              {normalizeActionType(presetForm.action_type) !== "top_up" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Target Exp (days)</FieldLabel>
                    <Input
                      type="number"
                      value={presetForm.target_expiration_days ?? ""}
                      onChange={(e) =>
                        setPresetForm((f) => ({
                          ...f,
                          target_expiration_days: parseOptionalInt(
                            e.target.value,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Max Candidate (days)</FieldLabel>
                    <Input
                      type="number"
                      value={presetForm.max_candidate_days ?? ""}
                      onChange={(e) =>
                        setPresetForm((f) => ({
                          ...f,
                          max_candidate_days: parseOptionalInt(e.target.value),
                        }))
                      }
                    />
                  </Field>
                </div>
              )}

              <Field>
                <FieldLabel>CC Filter</FieldLabel>
                <Select
                  value={
                    presetForm.cc == null
                      ? "all"
                      : presetForm.cc
                        ? "cc"
                        : "deal"
                  }
                  onValueChange={(value) =>
                    setPresetForm((f) => ({
                      ...f,
                      cc: value === "all" ? null : value === "cc",
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="cc">CC only</SelectItem>
                      <SelectItem value="deal">Deal only</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field orientation="horizontal">
                <Checkbox
                  id="preset-drop"
                  checked={presetForm.drop_claims}
                  onCheckedChange={(checked) =>
                    setPresetForm((f) => ({
                      ...f,
                      drop_claims: !!checked,
                    }))
                  }
                />
                <FieldLabel htmlFor="preset-drop" className="text-sm">
                  Drop Claims
                </FieldLabel>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPreset(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddPreset}
                disabled={
                  addPresetMutation.isPending ||
                  !presetForm.name.trim() ||
                  !isTopUpPresetValid(presetForm)
                }
              >
                Add Preset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add SP Assignment Dialog */}
      {showAddSP && (
        <Dialog open onOpenChange={() => setShowAddSP(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add SP Assignment</DialogTitle>
            </DialogHeader>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel>SP Address *</FieldLabel>
                <Input
                  value={spForm.sp}
                  onChange={(e) =>
                    setSPForm((f) => ({ ...f, sp: e.target.value }))
                  }
                  placeholder="f01234..."
                />
              </Field>
              <Field>
                <FieldLabel>Preset Name *</FieldLabel>
                {presets && presets.length > 0 ? (
                  <Select
                    value={spForm.preset || undefined}
                    onValueChange={(value) =>
                      setSPForm((f) => ({ ...f, preset: value ?? "" }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select preset..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {presets.map((p) => (
                          <SelectItem key={p.name} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={spForm.preset}
                    onChange={(e) =>
                      setSPForm((f) => ({ ...f, preset: e.target.value }))
                    }
                    placeholder="Preset name"
                  />
                )}
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddSP(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddSP}
                disabled={
                  addSPMutation.isPending ||
                  !spForm.sp.trim() ||
                  !spForm.preset.trim()
                }
              >
                Add Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Preset Dialog */}
      {editPreset && (
        <EditPresetDialog
          preset={editPreset}
          onClose={() => setEditPreset(null)}
          onSave={(updated) => {
            updatePresetMutation.mutate([toPresetPayload(updated)]);
            setEditPreset(null);
          }}
        />
      )}
    </div>
  );
}

function EditPresetDialog({
  preset,
  onClose,
  onSave,
}: {
  preset: ExpPreset;
  onClose: () => void;
  onSave: (p: ExpPreset) => void;
}) {
  const [form, setForm] = useState<ExpPreset>({ ...preset });
  const actionType = normalizeActionType(form.action_type);
  const hasLegacyAction = !isSupportedActionType(preset.action_type);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Preset: {preset.name}</DialogTitle>
        </DialogHeader>
        <FieldGroup className="gap-3">
          {hasLegacyAction && (
            <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
              This preset uses legacy action "{preset.action_type}" which Curio
              expmgr no longer executes. Save will migrate it to a supported
              action.
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel className="text-xs">Action Type</FieldLabel>
              <Select
                value={actionType}
                onValueChange={(value) =>
                  setForm({ ...form, action_type: value ?? "extend" })
                }
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="extend">Extend</SelectItem>
                    <SelectItem value="top_up">Top-up</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel className="text-xs">Above (days)</FieldLabel>
              <Input
                type="number"
                value={form.info_bucket_above_days}
                onChange={(e) =>
                  setForm({
                    ...form,
                    info_bucket_above_days:
                      Number.parseInt(e.target.value, 10) || 0,
                  })
                }
                className="text-xs"
              />
            </Field>
            <Field>
              <FieldLabel className="text-xs">Below (days)</FieldLabel>
              <Input
                type="number"
                value={form.info_bucket_below_days}
                onChange={(e) =>
                  setForm({
                    ...form,
                    info_bucket_below_days:
                      Number.parseInt(e.target.value, 10) || 0,
                  })
                }
                className="text-xs"
              />
            </Field>
          </div>

          {actionType === "top_up" && (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel className="text-xs">Low Water Mark</FieldLabel>
                <Input
                  type="number"
                  value={form.top_up_count_low_water_mark ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      top_up_count_low_water_mark: parseOptionalInt(
                        e.target.value,
                      ),
                    })
                  }
                  className="text-xs"
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">High Water Mark</FieldLabel>
                <Input
                  type="number"
                  value={form.top_up_count_high_water_mark ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      top_up_count_high_water_mark: parseOptionalInt(
                        e.target.value,
                      ),
                    })
                  }
                  className="text-xs"
                />
              </Field>
            </div>
          )}

          {actionType !== "top_up" && (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel className="text-xs">Target Exp (days)</FieldLabel>
                <Input
                  type="number"
                  value={form.target_expiration_days ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      target_expiration_days: parseOptionalInt(e.target.value),
                    })
                  }
                  className="text-xs"
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">
                  Max Candidate (days)
                </FieldLabel>
                <Input
                  type="number"
                  value={form.max_candidate_days ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_candidate_days: parseOptionalInt(e.target.value),
                    })
                  }
                  className="text-xs"
                />
              </Field>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel className="text-xs">CC Filter</FieldLabel>
              <Select
                value={form.cc == null ? "all" : form.cc ? "cc" : "deal"}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    cc: value === "all" ? null : value === "cc",
                  })
                }
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="cc">CC only</SelectItem>
                    <SelectItem value="deal">Deal only</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal" className="pt-6">
              <Checkbox
                id="edit-preset-drop-claims"
                checked={form.drop_claims}
                onCheckedChange={(checked) =>
                  setForm({ ...form, drop_claims: !!checked })
                }
              />
              <FieldLabel htmlFor="edit-preset-drop-claims" className="text-xs">
                Drop Claims
              </FieldLabel>
            </Field>
          </div>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!isTopUpPresetValid(form)}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
