import { BarChart3 } from "lucide-react";
import { SectionCard } from "@/components/composed/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HarmonyTaskStat } from "@/types/cluster";

interface TaskCountsProps {
  data: HarmonyTaskStat[];
  loading: boolean;
}

export function TaskCounts({ data, loading }: TaskCountsProps) {
  if (loading) {
    return (
      <SectionCard title="Task Statistics" icon={BarChart3}>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </SectionCard>
    );
  }

  if (!data.length) {
    return (
      <SectionCard title="Task Statistics" icon={BarChart3}>
        <p className="text-sm text-muted-foreground">
          No task statistics available
        </p>
      </SectionCard>
    );
  }

  const sorted = [...data].sort((a, b) => b.TotalCount - a.TotalCount);

  return (
    <SectionCard title="Task Statistics" icon={BarChart3}>
      <div className="space-y-2">
        {sorted.slice(0, 10).map((stat) => {
          const successRate =
            stat.TotalCount === 0
              ? 0
              : (stat.TrueCount / stat.TotalCount) * 100;

          return (
            <div
              key={stat.Name}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="font-medium">{stat.Name}</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{stat.TotalCount} total</span>
                <span
                  className={
                    successRate >= 95
                      ? "text-success"
                      : successRate >= 80
                        ? "text-warning"
                        : "text-destructive"
                  }
                >
                  {successRate.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
