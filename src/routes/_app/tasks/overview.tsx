import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import type { HarmonyTaskStat } from "@/types/cluster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/tasks/overview")({
  component: TaskOverviewPage,
});

function TaskOverviewPage() {
  const { data, isLoading } = useCurioRpc<HarmonyTaskStat[]>(
    "HarmonyTaskStats",
    [],
    { refetchInterval: 30_000 },
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const stats = data ?? [];
  const sorted = [...stats].sort((a, b) => b.TotalCount - a.TotalCount);

  const totals = stats.reduce(
    (acc, s) => ({
      total: acc.total + s.TotalCount,
      success: acc.success + s.TrueCount,
      failed: acc.failed + s.FalseCount,
    }),
    { total: 0, success: 0, failed: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Tasks</p>
            <p className="mt-1 text-3xl font-bold">{totals.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Succeeded</p>
            <p className="mt-1 text-3xl font-bold text-[hsl(var(--success))]">
              {totals.success}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Failed</p>
            <p className="mt-1 text-3xl font-bold text-[hsl(var(--destructive))]">
              {totals.failed}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sorted.map((stat) => {
              const rate =
                stat.TotalCount === 0
                  ? 0
                  : (stat.TrueCount / stat.TotalCount) * 100;
              return (
                <div
                  key={stat.Name}
                  className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2 last:border-0"
                >
                  <span className="font-medium">{stat.Name}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {stat.TotalCount} runs
                    </span>
                    <span
                      className={
                        rate >= 95
                          ? "text-[hsl(var(--success))]"
                          : rate >= 80
                            ? "text-[hsl(var(--warning))]"
                            : "text-[hsl(var(--destructive))]"
                      }
                    >
                      {rate.toFixed(1)}% success
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
