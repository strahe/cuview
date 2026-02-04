import { createFileRoute } from "@tanstack/react-router";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { KPICard } from "@/components/composed/kpi-card";
import { SectionCard } from "@/components/composed/section-card";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/composed/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  AlertHistoryItem,
  AlertHistoryListResult,
  AlertComment,
  AlertMute,
} from "@/types/alert";
import type { ColumnDef } from "@tanstack/react-table";
import { Bell, BellOff, MessageSquare, Check, CheckCheck } from "lucide-react";
import { useState, useCallback } from "react";

export const Route = createFileRoute("/_app/alerts/")({
  component: AlertsPage,
});

const alertColumns: ColumnDef<AlertHistoryItem>[] = [
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
      const s = row.original.severity;
      return (
        <StatusBadge
          status={s === "critical" ? "failed" : s === "warning" ? "warning" : "info"}
          label={s}
        />
      );
    },
  },
  { accessorKey: "category", header: "Category" },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => (
      <span className="max-w-md truncate text-sm">{row.original.message}</span>
    ),
  },
  { accessorKey: "machine_name", header: "Machine" },
  { accessorKey: "created_at", header: "Time" },
  {
    accessorKey: "acknowledged",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.acknowledged ? "done" : "warning"}
        label={row.original.acknowledged ? "Ack" : "Pending"}
      />
    ),
  },
];

const muteColumns: ColumnDef<AlertMute>[] = [
  { accessorKey: "category", header: "Category" },
  { accessorKey: "machine_pattern", header: "Machine Pattern" },
  { accessorKey: "message_pattern", header: "Message Pattern" },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.active ? "done" : "warning"}
        label={row.original.active ? "Active" : "Inactive"}
      />
    ),
  },
  { accessorKey: "expires_at", header: "Expires" },
  { accessorKey: "created_at", header: "Created" },
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
  const { data: categories } = useCurioRpc<string[]>("AlertCategoriesList", [], {
    refetchInterval: 120_000,
  });
  const { data: alertHistory, isLoading: historyLoading } =
    useCurioRpc<AlertHistoryListResult>("AlertHistoryListPaginated", [100, 0, true], {
      refetchInterval: 15_000,
    });
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

  const [selectedAlert, setSelectedAlert] = useState<AlertHistoryItem | null>(null);

  const alerts = alertHistory?.Alerts ?? [];
  const unackedAlerts = alerts.filter((a) => !a.acknowledged);

  const handleAckAll = useCallback(() => {
    const ids = unackedAlerts.map((a) => a.id);
    if (ids.length > 0) {
      ackMultipleMutation.mutate([ids]);
    }
  }, [unackedAlerts, ackMultipleMutation]);

  return (
    <div className="space-y-6 p-6">
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
            disabled={ackMultipleMutation.isPending || unackedAlerts.length === 0}
          >
            <CheckCheck className="mr-1 size-4" />
            {ackMultipleMutation.isPending ? "Acknowledging..." : `Ack All (${unackedAlerts.length})`}
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
            <Badge key={cat} variant="outline">
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
          searchColumn="message"
          emptyMessage="No alerts"
          onRowClick={(row) => setSelectedAlert(row)}
        />
      </SectionCard>

      {/* Mute Rules */}
      <SectionCard title="Mute Rules" icon={BellOff}>
        <DataTable
          columns={muteColumns}
          data={mutes ?? []}
          loading={mutesLoading}
          emptyMessage="No mute rules"
        />
      </SectionCard>

      {/* Alert Detail Dialog */}
      {selectedAlert && (
        <AlertDetailDialog
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAck={() => {
            ackMutation.mutate([selectedAlert.id]);
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
    [alert.id],
    { refetchInterval: 10_000 },
  );
  const addCommentMutation = useCurioRpcMutation("AlertCommentAdd", {
    invalidateKeys: [["curio", "AlertCommentList", alert.id]],
  });
  const [newComment, setNewComment] = useState("");

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate([alert.id, newComment.trim()]);
    setNewComment("");
  }, [alert.id, newComment, addCommentMutation]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusBadge
              status={
                alert.severity === "critical"
                  ? "failed"
                  : alert.severity === "warning"
                    ? "warning"
                    : "info"
              }
              label={alert.severity}
            />
            Alert #{alert.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <div className="text-[hsl(var(--muted-foreground))]">Category</div>
            <div>{alert.category}</div>
          </div>
          <div>
            <div className="text-[hsl(var(--muted-foreground))]">Machine</div>
            <div>{alert.machine_name}</div>
          </div>
          <div>
            <div className="text-[hsl(var(--muted-foreground))]">Message</div>
            <div className="whitespace-pre-wrap rounded-md bg-[hsl(var(--muted))] p-3 text-xs">
              {alert.message}
            </div>
          </div>
          <div>
            <div className="text-[hsl(var(--muted-foreground))]">Time</div>
            <div>{alert.created_at}</div>
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
                  <div key={c.id} className="rounded-md border border-[hsl(var(--border))] p-2 text-xs">
                    <div className="mb-1 flex justify-between text-[hsl(var(--muted-foreground))]">
                      <span>{c.author}</span>
                      <span>{c.created_at}</span>
                    </div>
                    <div>{c.comment}</div>
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
          {!alert.acknowledged && (
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
