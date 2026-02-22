import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurioRpc } from "@/hooks/use-curio-query";
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

  const { data: blockDelay } = useCurioRpc<number>("BlockDelaySecs", [], {
    refetchInterval: 300_000,
  });
  const { data: netSummary } = useCurioRpc<{
    Epoch: number;
    PeerCount: number;
    Bandwidth: string;
    Reachability: string;
    Nodes: { ID: string; Name: string }[];
  }>("NetSummary", [], { refetchInterval: 60_000 });

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

      {(netSummary || blockDelay) && (
        <Card>
          <CardHeader>
            <CardTitle>Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {blockDelay !== undefined && (
                <div>
                  <div className="text-[hsl(var(--muted-foreground))]">
                    Block Delay
                  </div>
                  <div className="font-medium">{blockDelay}s</div>
                </div>
              )}
              {netSummary && (
                <>
                  <div>
                    <div className="text-[hsl(var(--muted-foreground))]">
                      Epoch
                    </div>
                    <div className="font-medium">{netSummary.Epoch}</div>
                  </div>
                  <div>
                    <div className="text-[hsl(var(--muted-foreground))]">
                      Peers
                    </div>
                    <div className="font-medium">{netSummary.PeerCount}</div>
                  </div>
                  <div>
                    <div className="text-[hsl(var(--muted-foreground))]">
                      Reachability
                    </div>
                    <div className="font-medium">{netSummary.Reachability}</div>
                  </div>
                  {netSummary.Bandwidth && (
                    <div>
                      <div className="text-[hsl(var(--muted-foreground))]">
                        Bandwidth
                      </div>
                      <div className="font-medium">{netSummary.Bandwidth}</div>
                    </div>
                  )}
                  {netSummary.Nodes && netSummary.Nodes.length > 0 && (
                    <div>
                      <div className="text-[hsl(var(--muted-foreground))]">
                        Node Count
                      </div>
                      <div className="font-medium">{netSummary.Nodes.length}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
