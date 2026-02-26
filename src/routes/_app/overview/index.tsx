import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { usePageTitle } from "@/hooks/use-page-title";
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
    wallets,
    walletsLoading,
    refresh,
  } = useDashboardSummary();

  const { data: blockDelay } = useCurioRpc<number>("BlockDelaySecs", [], {
    refetchInterval: 300_000,
  });
  const { data: netSummary } = useCurioRpc<NetSummaryResponse>(
    "NetSummary",
    [],
    { refetchInterval: 60_000 },
  );

  return (
    <div className="space-y-4 p-6">
      {/* Layer 1: Header + KPI Cards */}
      <DashboardHero cards={heroCards} loading={loading} onRefresh={refresh} />

      {/* Layer 2: Network Status Strip */}
      <NetworkStatusStrip
        syncerState={syncerState}
        epoch={netSummary?.epoch}
        blockDelay={blockDelay}
        peerCount={netSummary?.peerCount}
        alertPending={metrics.alertPending}
      />

      {/* Layer 3: Two-Column Content Grid */}
      <div className="grid gap-4 xl:grid-cols-5">
        {/* Left Column (3/5 = 60%) */}
        <div className="space-y-4 xl:col-span-3">
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

        {/* Right Column (2/5 = 40%) */}
        <div className="space-y-4 xl:col-span-2">
          <ChainConnectivity data={syncerState} loading={syncLoading} />
          <ClusterMachines data={machines} loading={machinesLoading} />
          <WalletSummary data={wallets} loading={walletsLoading} />
          <StorageStats data={storageStats} loading={storageLoading} />
        </div>
      </div>
    </div>
  );
}
