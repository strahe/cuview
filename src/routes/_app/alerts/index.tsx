import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  MessageSquare,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { type MouseEvent, useCallback, useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { SectionCard } from "@/components/composed/section-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import type {
  AlertComment,
  AlertHistoryItem,
  AlertHistoryListResult,
  AlertMute,
} from "@/types/alert";
import { formatDateTime } from "@/utils/format";

export const Route = createFileRoute("/_app/alerts/")({
  component: AlertsPage,
});

const alertColumns: ColumnDef<AlertHistoryItem>[] = [
  {
    accessorKey: "AlertName",
    header: "Category",
  },
  {
    accessorKey: "Message",
    header: "Message",
    cell: ({ row }) => (
      <div
        className="max-w-[28rem] truncate text-sm"
        title={row.original.Message}
      >
        {row.original.Message}
      </div>
    ),
  },
  {
    accessorKey: "MachineName",
    header: "Machine",
    cell: ({ row }) => (
      <div
        className="max-w-[12rem] truncate"
        title={row.original.MachineName ?? "—"}
      >
        {row.original.MachineName ?? "—"}
      </div>
    ),
  },
  {
    accessorKey: "CreatedAt",
    header: "Time",
    cell: ({ row }) => <span>{formatDateTime(row.original.CreatedAt)}</span>,
  },
  {
    accessorKey: "CommentCount",
    header: "Comments",
    cell: ({ row }) => {
      const count = row.original.CommentCount;
      return count > 0 ? (
        <Badge variant="outline" className="gap-1">
          <MessageSquare className="size-3" />
          {count}
        </Badge>
      ) : null;
    },
  },
  {
    accessorKey: "Acknowledged",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.Acknowledged ? "done" : "warning"}
        label={row.original.Acknowledged ? "Ack" : "Active"}
      />
    ),
  },
];

interface MuteTableMeta {
  onReactivate: (id: number) => void;
  onRemove: (id: number) => void;
}

const muteColumns: ColumnDef<AlertMute>[] = [
  { accessorKey: "AlertName", header: "Category" },
  {
    accessorKey: "Pattern",
    header: "Pattern",
    cell: ({ row }) => (
      <div
        className="max-w-[18rem] truncate"
        title={row.original.Pattern ?? ""}
      >
        {row.original.Pattern || "—"}
      </div>
    ),
  },
  {
    accessorKey: "Reason",
    header: "Reason",
    cell: ({ row }) => (
      <div className="max-w-[18rem] truncate" title={row.original.Reason ?? ""}>
        {row.original.Reason || "—"}
      </div>
    ),
  },
  { accessorKey: "MutedBy", header: "Muted By" },
  {
    accessorKey: "Active",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.Active ? "done" : "warning"}
        label={row.original.Active ? "Active" : "Inactive"}
      />
    ),
  },
  {
    accessorKey: "ExpiresAt",
    header: "Expires",
    cell: ({ row }) => (
      <span>
        {row.original.ExpiresAt ? formatDateTime(row.original.ExpiresAt) : "—"}
      </span>
    ),
  },
  {
    accessorKey: "MutedAt",
    header: "Created",
    cell: ({ row }) => <span>{formatDateTime(row.original.MutedAt)}</span>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const mute = row.original;
      const meta = table.options.meta as MuteTableMeta | undefined;
      return (
        <div className="flex gap-1">
          {!mute.Active && (
            <Button
              size="sm"
              variant="ghost"
              title="Reactivate"
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                meta?.onReactivate(mute.ID);
              }}
            >
              <RotateCcw className="size-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            title="Remove"
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              meta?.onRemove(mute.ID);
            }}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      );
    },
  },
];

function AlertsPage() {
  usePageTitle("Alerts");

  const { data: pendingCount } = useCurioRpc<number>("AlertPendingCount", [], {
    refetchInterval: 15_000,
  });
  const { data: unackedCount } = useCurioRpc<number>(
    "AlertUnacknowledgedCount",
    [],
    { refetchInterval: 15_000 },
  );
  const { data: categories } = useCurioRpc<string[]>(
    "AlertCategoriesList",
    [],
    {
      refetchInterval: 120_000,
    },
  );
  const { data: alertHistory, isLoading: historyLoading } =
    useCurioRpc<AlertHistoryListResult>(
      "AlertHistoryListPaginated",
      [100, 0, true],
      {
        refetchInterval: 15_000,
      },
    );
  const { data: mutes, isLoading: mutesLoading } = useCurioRpc<AlertMute[]>(
    "AlertMuteList",
    [],
    { refetchInterval: 60_000 },
  );

  const ackMutation = useCurioRpcMutation("AlertAcknowledge", {
    invalidateKeys: [
      ["curio", "AlertHistoryListPaginated"],
      ["curio", "AlertPendingCount"],
      ["curio", "AlertUnacknowledgedCount"],
    ],
  });
  const ackMultipleMutation = useCurioRpcMutation("AlertAcknowledgeMultiple", {
    invalidateKeys: [
      ["curio", "AlertHistoryListPaginated"],
      ["curio", "AlertPendingCount"],
      ["curio", "AlertUnacknowledgedCount"],
    ],
  });
  const sendTestMutation = useCurioRpcMutation("AlertSendTest", {
    invalidateKeys: [["curio", "AlertHistoryListPaginated"]],
  });
  const muteAddMutation = useCurioRpcMutation("AlertMuteAdd", {
    invalidateKeys: [["curio", "AlertMuteList"]],
  });
  const muteRemoveMutation = useCurioRpcMutation("AlertMuteRemove", {
    invalidateKeys: [["curio", "AlertMuteList"]],
  });
  const muteReactivateMutation = useCurioRpcMutation("AlertMuteReactivate", {
    invalidateKeys: [["curio", "AlertMuteList"]],
  });

  const [selectedAlert, setSelectedAlert] = useState<AlertHistoryItem | null>(
    null,
  );
  const [showMuteForm, setShowMuteForm] = useState(false);
  const [muteForm, setMuteForm] = useState({
    category: "",
    machinePattern: "",
    messagePattern: "",
    durationHours: 24,
  });

  const alerts = alertHistory?.Alerts ?? [];
  const unackedAlerts = alerts.filter((a) => !a.Acknowledged);

  const handleAckAll = useCallback(() => {
    const ids = unackedAlerts.map((a) => a.ID);
    if (ids.length > 0) {
      ackMultipleMutation.mutate([ids]);
    }
  }, [unackedAlerts, ackMultipleMutation]);

  const handleAddMute = useCallback(() => {
    if (!muteForm.category.trim()) return;
    muteAddMutation.mutate([
      muteForm.category.trim(),
      muteForm.machinePattern.trim() || "*",
      muteForm.messagePattern.trim() || "*",
      muteForm.durationHours,
    ]);
    setMuteForm({
      category: "",
      machinePattern: "",
      messagePattern: "",
      durationHours: 24,
    });
    setShowMuteForm(false);
  }, [muteForm, muteAddMutation]);

  const muteTableMeta: MuteTableMeta = {
    onReactivate: (id) => muteReactivateMutation.mutate([id]),
    onRemove: (id) => muteRemoveMutation.mutate([id]),
  };

  return (
    <div className="space-y-6 overflow-x-hidden p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="size-5" />
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => sendTestMutation.mutate([])}
            disabled={sendTestMutation.isPending}
          >
            {sendTestMutation.isPending ? "Sending..." : "Send Test Alert"}
          </Button>
          <Button
            size="sm"
            onClick={handleAckAll}
            disabled={
              ackMultipleMutation.isPending || unackedAlerts.length === 0
            }
          >
            <CheckCheck className="mr-1 size-4" />
            {ackMultipleMutation.isPending
              ? "Acknowledging..."
              : `Ack All (${unackedAlerts.length})`}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard label="Pending" value={pendingCount ?? 0} />
        <KPICard label="Unacknowledged" value={unackedCount ?? 0} />
        <KPICard label="Total Alerts" value={alertHistory?.Total ?? 0} />
        <KPICard label="Categories" value={categories?.length ?? 0} />
      </div>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge key={cat} variant="outline" className="break-all">
              {cat}
            </Badge>
          ))}
        </div>
      )}

      {/* Alert History */}
      <SectionCard title="Alert History" icon={Bell}>
        <DataTable
          columns={alertColumns}
          data={alerts}
          loading={historyLoading}
          searchable
          searchPlaceholder="Search alerts..."
          searchColumn="Message"
          emptyMessage="No alerts"
          onRowClick={(row) => setSelectedAlert(row)}
        />
      </SectionCard>

      {/* Mute Rules */}
      <SectionCard
        title="Mute Rules"
        icon={BellOff}
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowMuteForm(true)}
          >
            <Plus className="mr-1 size-4" />
            Add Mute Rule
          </Button>
        }
      >
        <DataTable
          columns={muteColumns}
          data={mutes ?? []}
          loading={mutesLoading}
          emptyMessage="No mute rules"
          meta={muteTableMeta}
        />
      </SectionCard>

      {/* Add Mute Rule Dialog */}
      {showMuteForm && (
        <Dialog open onOpenChange={() => setShowMuteForm(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Mute Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Category *</label>
                <Input
                  value={muteForm.category}
                  onChange={(e) =>
                    setMuteForm((f) => ({ ...f, category: e.target.value }))
                  }
                  placeholder="e.g. storage"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Machine Pattern</label>
                <Input
                  value={muteForm.machinePattern}
                  onChange={(e) =>
                    setMuteForm((f) => ({
                      ...f,
                      machinePattern: e.target.value,
                    }))
                  }
                  placeholder="* for all"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message Pattern</label>
                <Input
                  value={muteForm.messagePattern}
                  onChange={(e) =>
                    setMuteForm((f) => ({
                      ...f,
                      messagePattern: e.target.value,
                    }))
                  }
                  placeholder="* for all"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (hours)</label>
                <Input
                  type="number"
                  value={muteForm.durationHours}
                  onChange={(e) =>
                    setMuteForm((f) => ({
                      ...f,
                      durationHours: parseInt(e.target.value, 10) || 24,
                    }))
                  }
                  min={1}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMuteForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddMute}
                disabled={
                  muteAddMutation.isPending || !muteForm.category.trim()
                }
              >
                {muteAddMutation.isPending ? "Adding..." : "Add Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Alert Detail Dialog */}
      {selectedAlert && (
        <AlertDetailDialog
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAck={() => {
            ackMutation.mutate([selectedAlert.ID]);
            setSelectedAlert(null);
          }}
          acking={ackMutation.isPending}
        />
      )}
    </div>
  );
}

function AlertDetailDialog({
  alert,
  onClose,
  onAck,
  acking,
}: {
  alert: AlertHistoryItem;
  onClose: () => void;
  onAck: () => void;
  acking: boolean;
}) {
  const { data: comments } = useCurioRpc<AlertComment[]>(
    "AlertCommentList",
    [alert.ID],
    { refetchInterval: 10_000 },
  );
  const addCommentMutation = useCurioRpcMutation("AlertCommentAdd", {
    invalidateKeys: [["curio", "AlertCommentList", alert.ID]],
  });
  const [newComment, setNewComment] = useState("");

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate([alert.ID, newComment.trim()]);
    setNewComment("");
  }, [alert.ID, newComment, addCommentMutation]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-4" />
            Alert #{alert.ID}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <div className="text-muted-foreground">Category</div>
            <div>{alert.AlertName}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Machine</div>
            <div>{alert.MachineName ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Message</div>
            <div className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
              {alert.Message}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Time</div>
            <div>{formatDateTime(alert.CreatedAt)}</div>
          </div>
          {alert.Acknowledged && (
            <div className="flex gap-6">
              {alert.AcknowledgedBy && (
                <div>
                  <div className="text-muted-foreground">Acknowledged By</div>
                  <div>{alert.AcknowledgedBy}</div>
                </div>
              )}
              {alert.AcknowledgedAt && (
                <div>
                  <div className="text-muted-foreground">Acknowledged At</div>
                  <div>{formatDateTime(alert.AcknowledgedAt)}</div>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-6">
            <div>
              <div className="text-muted-foreground">Sent to Plugins</div>
              <StatusBadge
                status={alert.SentToPlugins ? "done" : "warning"}
                label={alert.SentToPlugins ? "Yes" : "No"}
              />
            </div>
            {alert.SentAt && (
              <div>
                <div className="text-muted-foreground">Sent At</div>
                <div>{formatDateTime(alert.SentAt)}</div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h4 className="mb-2 flex items-center gap-1 font-medium">
              <MessageSquare className="size-4" />
              Comments ({comments?.length ?? 0})
            </h4>
            {comments && comments.length > 0 && (
              <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
                {comments.map((c) => (
                  <div
                    key={c.ID}
                    className="rounded-md border border-border p-2 text-xs"
                  >
                    <div className="mb-1 flex justify-between text-muted-foreground">
                      <span>{c.CreatedBy}</span>
                      <span>{formatDateTime(c.CreatedAt)}</span>
                    </div>
                    <div>{c.Comment}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] text-xs"
              />
            </div>
            <Button
              size="sm"
              className="mt-2"
              onClick={handleAddComment}
              disabled={addCommentMutation.isPending || !newComment.trim()}
            >
              {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          {!alert.Acknowledged && (
            <Button size="sm" onClick={onAck} disabled={acking}>
              <Check className="mr-1 size-4" />
              {acking ? "Acknowledging..." : "Acknowledge"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
