import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    if (!presetForm.name.trim()) return;
    addPresetMutation.mutate([presetForm]);
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
    { accessorKey: "action_type", header: "Action" },
    { accessorKey: "info_bucket_above_days", header: "Above (days)" },
    { accessorKey: "info_bucket_below_days", header: "Below (days)" },
    {
      id: "cc",
      header: "CC Only",
      cell: ({ row }) =>
        row.original.cc == null ? "—" : row.original.cc ? "Yes" : "No",
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
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.enabled ? "done" : "warning"}
          label={row.original.enabled ? "Enabled" : "Disabled"}
        />
      ),
    },
    {
      accessorKey: "last_run_at",
      header: "Last Run",
      cell: ({ row }) => row.original.last_run_at || "—",
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
      <Tabs>
        <TabsList>
          <TabsTrigger
            active={tab === "buckets"}
            onClick={() => setTab("buckets")}
          >
            Expiration Buckets
          </TabsTrigger>
          <TabsTrigger
            active={tab === "presets"}
            onClick={() => setTab("presets")}
          >
            Presets
          </TabsTrigger>
          <TabsTrigger active={tab === "sps"} onClick={() => setTab("sps")}>
            SP Assignments
          </TabsTrigger>
        </TabsList>
        <TabsContent>
          {tab === "buckets" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Expiration Buckets</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddBucket(true)}
                >
                  <Plus className="mr-1 size-4" /> Add Bucket
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[hsl(var(--border))]">
                            <th className="py-1 text-left">SP</th>
                            <th className="py-1 text-right">{"< Days"}</th>
                            <th className="py-1 text-right">Total</th>
                            <th className="py-1 text-right">CC</th>
                            <th className="py-1 text-right">Deal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bucketCounts.map((bc, i) => (
                            <tr
                              key={i}
                              className="border-b border-[hsl(var(--border))] last:border-0"
                            >
                              <td className="py-1 font-mono">
                                {bc.sp_address}
                              </td>
                              <td className="py-1 text-right">
                                {bc.less_than_days}
                              </td>
                              <td className="py-1 text-right font-medium">
                                {bc.total_count}
                              </td>
                              <td className="py-1 text-right">{bc.cc_count}</td>
                              <td className="py-1 text-right">
                                {bc.deal_count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                  <Plus className="mr-1 size-4" /> Add Preset
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
                  <Plus className="mr-1 size-4" /> Add Assignment
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
        </TabsContent>
      </Tabs>

      {/* Add Bucket Dialog */}
      {showAddBucket && (
        <Dialog open onOpenChange={() => setShowAddBucket(false)}>
          <DialogContent
            className="max-w-sm"
            onClose={() => setShowAddBucket(false)}
          >
            <DialogHeader>
              <DialogTitle>Add Expiration Bucket</DialogTitle>
            </DialogHeader>
            <div>
              <label className="text-sm font-medium">Less Than (days) *</label>
              <Input
                type="number"
                value={newBucketDays}
                onChange={(e) => setNewBucketDays(e.target.value)}
              />
            </div>
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
          <DialogContent
            className="max-w-lg"
            onClose={() => setShowAddPreset(false)}
          >
            <DialogHeader>
              <DialogTitle>Add Expiration Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={presetForm.name}
                  onChange={(e) =>
                    setPresetForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Preset name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Action Type</label>
                <select
                  className="w-full rounded border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm"
                  value={presetForm.action_type}
                  onChange={(e) =>
                    setPresetForm((f) => ({
                      ...f,
                      action_type: e.target.value,
                    }))
                  }
                >
                  <option value="extend">Extend</option>
                  <option value="terminate">Terminate</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Above Days</label>
                  <Input
                    type="number"
                    value={presetForm.info_bucket_above_days}
                    onChange={(e) =>
                      setPresetForm((f) => ({
                        ...f,
                        info_bucket_above_days:
                          parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Below Days</label>
                  <Input
                    type="number"
                    value={presetForm.info_bucket_below_days}
                    onChange={(e) =>
                      setPresetForm((f) => ({
                        ...f,
                        info_bucket_below_days:
                          parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="preset-drop"
                  checked={presetForm.drop_claims}
                  onChange={(e) =>
                    setPresetForm((f) => ({
                      ...f,
                      drop_claims: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="preset-drop" className="text-sm">
                  Drop Claims
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPreset(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddPreset}
                disabled={
                  addPresetMutation.isPending || !presetForm.name.trim()
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
          <DialogContent
            className="max-w-md"
            onClose={() => setShowAddSP(false)}
          >
            <DialogHeader>
              <DialogTitle>Add SP Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">SP Address *</label>
                <Input
                  value={spForm.sp}
                  onChange={(e) =>
                    setSPForm((f) => ({ ...f, sp: e.target.value }))
                  }
                  placeholder="f01234..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Preset Name *</label>
                {presets && presets.length > 0 ? (
                  <select
                    className="w-full rounded border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm"
                    value={spForm.preset}
                    onChange={(e) =>
                      setSPForm((f) => ({ ...f, preset: e.target.value }))
                    }
                  >
                    <option value="">Select preset...</option>
                    {presets.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={spForm.preset}
                    onChange={(e) =>
                      setSPForm((f) => ({ ...f, preset: e.target.value }))
                    }
                    placeholder="Preset name"
                  />
                )}
              </div>
            </div>
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
            updatePresetMutation.mutate([updated]);
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

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Edit Preset: {preset.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Action Type</label>
            <Input
              value={form.action_type}
              onChange={(e) =>
                setForm({ ...form, action_type: e.target.value })
              }
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Above (days)</label>
            <Input
              type="number"
              value={form.info_bucket_above_days}
              onChange={(e) =>
                setForm({
                  ...form,
                  info_bucket_above_days: parseInt(e.target.value, 10) || 0,
                })
              }
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Below (days)</label>
            <Input
              type="number"
              value={form.info_bucket_below_days}
              onChange={(e) =>
                setForm({
                  ...form,
                  info_bucket_below_days: parseInt(e.target.value, 10) || 0,
                })
              }
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Target Exp (days)</label>
            <Input
              type="number"
              value={form.target_expiration_days ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  target_expiration_days: e.target.value
                    ? parseInt(e.target.value, 10)
                    : null,
                })
              }
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Max Candidate (days)</label>
            <Input
              type="number"
              value={form.max_candidate_days ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_candidate_days: e.target.value
                    ? parseInt(e.target.value, 10)
                    : null,
                })
              }
              className="text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.cc ?? false}
              onChange={(e) => setForm({ ...form, cc: e.target.checked })}
            />
            <label className="text-xs">CC Only</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.drop_claims}
              onChange={(e) =>
                setForm({ ...form, drop_claims: e.target.checked })
              }
            />
            <label className="text-xs">Drop Claims</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
