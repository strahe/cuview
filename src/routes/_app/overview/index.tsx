import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWalletList } from "@/routes/_app/wallets/-module/queries";
import type { NetSummaryResponse } from "@/types/network";
import { ActorOverview } from "./-components/actor-overview";
import { ChainConnectivity } from "./-components/chain-connectivity";
import { ClusterMachines } from "./-components/cluster-machines";
import { DashboardHero } from "./-components/dashboard-hero";
import { DashboardRecentTasks } from "./-components/dashboard-recent-tasks";
import { NetworkStatusStrip } from "./-components/network-status-strip";
import { PipelineActivity } from "./-components/pipeline-activity";
import { StorageStats } from "./-components/storage-stats";
import { WalletSummary } from "./-components/wallet-summary";

export const Route = createFileRoute("/_app/overview/")({
  component: OverviewPage,
});

function OverviewPage() {
  usePageTitle("Overview");

  const {
    loading,
    heroCards,
    metrics,
    syncerState,
    syncLoading,
    storageStats,
    storageLoading,
    machines,
    machinesLoading,
    recentTasks,
    recentTasksLoading,
    recentTasksError,
    actors,
    actorsLoading,
    pipelinePorepStats,
    pipelineSnapStats,
    pipelineLoading,
    refresh,
  } = useDashboardSummary();

  const { data: wallets, isLoading: walletsLoading } = useWalletList();

  const { data: blockDelay } = useCurioRpc<number>("BlockDelaySecs", [], {
    refetchInterval: 300_000,
  });
  const { data: netSummary } = useCurioRpc<NetSummaryResponse>(
    "NetSummary",
    [],
    { refetchInterval: 60_000 },
  );

  return (
    <div className="flex w-full flex-col gap-4 p-4 sm:p-6">
      <DashboardHero cards={heroCards} loading={loading} onRefresh={refresh} />

      <NetworkStatusStrip
        syncerState={syncerState}
        epoch={netSummary?.epoch}
        blockDelay={blockDelay}
        peerCount={netSummary?.peerCount}
        alertPending={metrics.alertPending}
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-3">
          <ActorOverview data={actors} loading={actorsLoading} />
          <PipelineActivity
            porepStats={pipelinePorepStats}
            snapStats={pipelineSnapStats}
            loading={pipelineLoading}
          />
          <DashboardRecentTasks
            data={recentTasks}
            loading={recentTasksLoading}
            error={recentTasksError}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
          <ChainConnectivity data={syncerState} loading={syncLoading} />
          <ClusterMachines data={machines} loading={machinesLoading} />
          <WalletSummary data={wallets} loading={walletsLoading} />
          <StorageStats data={storageStats} loading={storageLoading} />
        </div>
      </div>
    </div>
  );
}
