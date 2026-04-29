import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";

export const Route = createFileRoute("/_app/sectors/cc-scheduler/")({
  component: CCSchedulerPage,
});

interface CCSchedulerEntry {
  SpID: number;
  ToSeal: number;
  Weight: number;
  DurationDays: number;
  Enabled: boolean;
  SPAddress: string;
  SectorSize: number;
  RequestedSize: string;
}

const invalidateKeys = [["curio", "SectorCCScheduler"]];

function CCSchedulerPage() {
  const { data, isLoading } = useCurioRpc<CCSchedulerEntry[]>(
    "SectorCCScheduler",
    [],
    { refetchInterval: 30_000 },
  );

  const editMutation = useCurioRpcMutation("SectorCCSchedulerEdit", {
    invalidateKeys,
  });
  const deleteMutation = useCurioRpcMutation("SectorCCSchedulerDelete", {
    invalidateKeys,
  });

  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState<CCSchedulerEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    sp: "",
    toSeal: "1",
    weight: "10",
    durationDays: "540",
    enabled: true,
  });

  const resetForm = useCallback(() => {
    setForm({
      sp: "",
      toSeal: "1",
      weight: "10",
      durationDays: "540",
      enabled: true,
    });
  }, []);

  const handleAdd = useCallback(() => {
    if (!form.sp.trim()) return;
    editMutation.mutate(
      [
        form.sp.trim(),
        parseInt(form.toSeal, 10),
        parseInt(form.weight, 10),
        parseInt(form.durationDays, 10),
        form.enabled,
      ],
      {
        onSuccess: () => {
          setShowAdd(false);
          resetForm();
        },
      },
    );
  }, [form, editMutation, resetForm]);

  const handleEdit = useCallback(() => {
    if (!editEntry) return;
    editMutation.mutate(
      [
        editEntry.SPAddress,
        parseInt(form.toSeal, 10),
        parseInt(form.weight, 10),
        parseInt(form.durationDays, 10),
        form.enabled,
      ],
      {
        onSuccess: () => {
          setEditEntry(null);
          resetForm();
        },
      },
    );
  }, [editEntry, form, editMutation, resetForm]);

  const handleDelete = useCallback(
    (sp: string) => {
      deleteMutation.mutate([sp]);
      setConfirmDelete(null);
    },
    [deleteMutation],
  );

  const openEdit = useCallback((entry: CCSchedulerEntry) => {
    setForm({
      sp: entry.SPAddress,
      toSeal: String(entry.ToSeal),
      weight: String(entry.Weight),
      durationDays: String(entry.DurationDays),
      enabled: entry.Enabled,
    });
    setEditEntry(entry);
  }, []);

  const columns: ColumnDef<CCSchedulerEntry>[] = [
    {
      accessorKey: "SPAddress",
      header: "SP",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.SPAddress}</span>
      ),
    },
    { accessorKey: "ToSeal", header: "To Seal" },
    { accessorKey: "Weight", header: "Weight" },
    { accessorKey: "DurationDays", header: "Duration (days)" },
    {
      accessorKey: "RequestedSize",
      header: "Requested Size",
    },
    {
      id: "enabled",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.Enabled ? "done" : "warning"}
          label={row.original.Enabled ? "Enabled" : "Disabled"}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const sp = row.original.SPAddress;
        if (confirmDelete === sp) {
          return (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(sp)}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(null)}
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
              title="Edit entry"
              aria-label="Edit entry"
              onClick={() => openEdit(row.original)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="Delete entry"
              aria-label="Delete entry"
              onClick={() => setConfirmDelete(sp)}
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>CC Sector Scheduler</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
          >
            <Plus data-icon="inline-start" /> Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data ?? []}
            loading={isLoading}
            emptyMessage="No CC scheduler entries"
          />
        </CardContent>
      </Card>

      {/* Add Dialog */}
      {showAdd && (
        <Dialog open onOpenChange={() => setShowAdd(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add CC Scheduler Entry</DialogTitle>
            </DialogHeader>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel>SP Address *</FieldLabel>
                <Input
                  value={form.sp}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sp: e.target.value }))
                  }
                  placeholder="f01234..."
                />
              </Field>
              <Field>
                <FieldLabel>Sectors to Seal</FieldLabel>
                <Input
                  type="number"
                  value={form.toSeal}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, toSeal: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Weight</FieldLabel>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, weight: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Duration (days)</FieldLabel>
                <Input
                  type="number"
                  value={form.durationDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationDays: e.target.value }))
                  }
                />
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="add-enabled"
                  checked={form.enabled}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, enabled: !!checked }))
                  }
                />
                <FieldLabel htmlFor="add-enabled" className="text-sm">
                  Enabled
                </FieldLabel>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={editMutation.isPending || !form.sp.trim()}
              >
                {editMutation.isPending && (
                  <Spinner data-icon="inline-start" className="size-3" />
                )}
                {editMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editEntry && (
        <Dialog open onOpenChange={() => setEditEntry(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Edit CC Scheduler: {editEntry.SPAddress}
              </DialogTitle>
            </DialogHeader>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel>Sectors to Seal</FieldLabel>
                <Input
                  type="number"
                  value={form.toSeal}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, toSeal: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Weight</FieldLabel>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, weight: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Duration (days)</FieldLabel>
                <Input
                  type="number"
                  value={form.durationDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationDays: e.target.value }))
                  }
                />
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="edit-enabled"
                  checked={form.enabled}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, enabled: !!checked }))
                  }
                />
                <FieldLabel htmlFor="edit-enabled" className="text-sm">
                  Enabled
                </FieldLabel>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditEntry(null)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={editMutation.isPending}>
                {editMutation.isPending && (
                  <Spinner data-icon="inline-start" className="size-3" />
                )}
                {editMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
