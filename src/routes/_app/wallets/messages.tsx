import { createFileRoute } from "@tanstack/react-router";
import { KPICard } from "@/components/composed/kpi-card";
import { SectionCard } from "@/components/composed/section-card";
import { DataTable } from "@/components/table/data-table";
import { MessageDetailCard } from "./-components/message-detail-card";
import { pendingMsgColumns } from "./-components/pending-msg-columns";
import { usePendingMessages } from "./-module/queries";

export const Route = createFileRoute("/_app/wallets/messages")({
  component: WalletMessagesPage,
});

export function WalletMessagesPage() {
  const pendingQuery = usePendingMessages();
  const pendingMessages = pendingQuery.data?.messages ?? [];
  const total = pendingQuery.data?.total ?? pendingMessages.length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KPICard label="Queue Size" value={total} />
      </div>

      <SectionCard title="Pending Messages">
        {pendingQuery.isError ? (
          <p className="text-sm text-destructive">
            {(pendingQuery.error as Error)?.message ??
              "Failed to load pending messages."}
          </p>
        ) : (
          <DataTable
            columns={pendingMsgColumns}
            data={pendingMessages}
            loading={pendingQuery.isLoading}
            searchable
            searchColumn="message"
            searchPlaceholder="Search pending message CID..."
            pageSize={10}
            emptyMessage="No pending messages."
          />
        )}
      </SectionCard>

      <SectionCard title="Message Lookup">
        <MessageDetailCard />
      </SectionCard>
    </div>
  );
}
