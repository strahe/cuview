import { createFileRoute } from "@tanstack/react-router";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { usePageTitle } from "@/hooks/use-page-title";
import { ChainConnectivity } from "./-components/chain-connectivity";
import { ClusterMachines } from "./-components/cluster-machines";
import { DashboardHero } from "./-components/dashboard-hero";
import { DashboardRecentTasks } from "./-components/dashboard-recent-tasks";
import { StorageStats } from "./-components/storage-stats";
import { TaskCounts } from "./-components/task-counts";

export const Route = createFileRoute("/_app/overview/")({
  component: OverviewPage,
});

function OverviewPage() {
  usePageTitle("Dashboard");

  const {
    loading,
    heroCards,
    syncerState,
    syncLoading,
    storageStats,
    storageLoading,
    machines,
    machinesLoading,
    taskStats,
    taskStatsLoading,
    recentTasks,
    recentTasksLoading,
    recentTasksError,
    refresh,
  } = useDashboardSummary();

  return (
    <div className="space-y-6 p-6">
      <DashboardHero cards={heroCards} loading={loading} onRefresh={refresh} />

      <div className="grid gap-6 xl:grid-cols-2">
        <ChainConnectivity data={syncerState} loading={syncLoading} />
        <StorageStats data={storageStats} loading={storageLoading} />

        <div className="xl:col-span-2">
          <ClusterMachines data={machines} loading={machinesLoading} />
        </div>

        <TaskCounts data={taskStats} loading={taskStatsLoading} />
        <DashboardRecentTasks
          data={recentTasks}
          loading={recentTasksLoading}
          error={recentTasksError}
        />
      </div>
    </div>
  );
}
