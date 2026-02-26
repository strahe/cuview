import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { usePageTitle } from "@/hooks/use-page-title";
import type { NetSummaryResponse } from "@/types/network";
import { formatBytes } from "@/utils/format";
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
  const { data: netSummary } = useCurioRpc<NetSummaryResponse>(
    "NetSummary",
    [],
    { refetchInterval: 60_000 },
  );

  return (
    <div className="space-y-4 p-6">
      <DashboardHero cards={heroCards} loading={loading} onRefresh={refresh} />

      <div className="grid gap-4 xl:grid-cols-2">
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {blockDelay !== undefined && (
                <div>
                  <div className="text-muted-foreground">Block Delay</div>
                  <div className="font-medium">{blockDelay}s</div>
                </div>
              )}
              {netSummary && (
                <>
                  <div>
                    <div className="text-muted-foreground">Epoch</div>
                    <div className="font-medium">{netSummary.epoch}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Peers</div>
                    <div className="font-medium">{netSummary.peerCount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Reachability</div>
                    <div className="font-medium">
                      {netSummary.reachability?.status ?? "—"}
                    </div>
                  </div>
                  {netSummary.bandwidth && (
                    <>
                      <div>
                        <div className="text-muted-foreground">
                          Bandwidth In
                        </div>
                        <div className="font-medium">
                          {formatBytes(netSummary.bandwidth.rateIn)}/s
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Bandwidth Out
                        </div>
                        <div className="font-medium">
                          {formatBytes(netSummary.bandwidth.rateOut)}/s
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <div className="text-muted-foreground">Node Count</div>
                    <div className="font-medium">{netSummary.nodeCount}</div>
                  </div>
                </>
              )}
            </div>

            {/* Per-node details */}
            {netSummary?.nodes && netSummary.nodes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Node</th>
                      <th className="pb-2 pr-3 font-medium">Epoch</th>
                      <th className="pb-2 pr-3 font-medium">Peers</th>
                      <th className="pb-2 pr-3 font-medium">In</th>
                      <th className="pb-2 pr-3 font-medium">Out</th>
                      <th className="pb-2 font-medium">Reachability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {netSummary.nodes.map((node) => (
                      <tr
                        key={node.node}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-1.5 pr-3 font-medium">{node.node}</td>
                        <td className="py-1.5 pr-3 text-muted-foreground">
                          {node.epoch}
                        </td>
                        <td className="py-1.5 pr-3 text-muted-foreground">
                          {node.peerCount}
                        </td>
                        <td className="py-1.5 pr-3 text-muted-foreground">
                          {formatBytes(node.bandwidth?.rateIn ?? 0)}/s
                        </td>
                        <td className="py-1.5 pr-3 text-muted-foreground">
                          {formatBytes(node.bandwidth?.rateOut ?? 0)}/s
                        </td>
                        <td className="py-1.5 text-muted-foreground">
                          {node.reachability?.status ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
