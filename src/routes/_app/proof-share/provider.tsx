import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { Button } from "@/components/ui/button";
import { formatFilecoin } from "@/utils/filecoin";
import { unwrapSqlNullableString } from "@/utils/sql";
import { PaymentSummaryCard } from "./-components/payment-summary-card";
import { ProviderQueueCard } from "./-components/provider-queue-card";
import { ProviderSettingsDialog } from "./-components/provider-settings-dialog";
import { SettlementsCard } from "./-components/settlements-card";
import { WorkAsksCard } from "./-components/work-asks-card";
import {
  usePsListAsks,
  usePsListQueue,
  usePsListSettlements,
  usePsMeta,
  usePsPaymentSummary,
} from "./-module/queries";

export const Route = createFileRoute("/_app/proof-share/provider")({
  component: ProviderPage,
});

function ProviderPage() {
  const { data: meta } = usePsMeta();
  const { data: queue, isLoading: queueLoading } = usePsListQueue();
  const { data: payments } = usePsPaymentSummary();
  const { data: asks } = usePsListAsks();
  const { data: settlements } = usePsListSettlements();

  const [showSettings, setShowSettings] = useState(false);
  const formattedPrice = meta?.price
    ? formatFilecoin(meta.price).replace(/ FIL$/, " FIL/p")
    : "0 FIL/p";

  return (
    <div className="space-y-6">
      {meta && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KPICard
            label="Status"
            value={meta.enabled ? "Enabled" : "Disabled"}
          />
          <KPICard
            label="Wallet"
            value={unwrapSqlNullableString(meta.wallet) || "—"}
          />
          <KPICard label="Price" value={formattedPrice} />
          <KPICard label="Queue" value={queue?.length ?? 0} />
        </div>
      )}

      <ProviderQueueCard
        queue={queue ?? []}
        loading={queueLoading}
        headerAction={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="mr-1 size-4" /> Settings
          </Button>
        }
      />

      <PaymentSummaryCard payments={payments ?? []} />
      <WorkAsksCard asks={asks ?? []} />
      <SettlementsCard settlements={settlements ?? []} />

      <ProviderSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        meta={meta}
      />
    </div>
  );
}
