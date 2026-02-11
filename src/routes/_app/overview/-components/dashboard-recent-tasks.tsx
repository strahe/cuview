import { formatDistanceToNow } from "date-fns";
import { Zap } from "lucide-react";
import { SectionCard } from "@/components/composed/section-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskHistorySummary } from "@/types/task";

interface DashboardRecentTasksProps {
  data: TaskHistorySummary[];
  loading: boolean;
  error: Error | null;
}

export function DashboardRecentTasks({
  data,
  loading,
  error,
}: DashboardRecentTasksProps) {
  if (loading) {
    return (
      <SectionCard title="Recent Tasks" icon={Zap}>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard title="Recent Tasks" icon={Zap}>
        <p className="text-sm text-[hsl(var(--destructive))]">
          Failed to load recent tasks
        </p>
      </SectionCard>
    );
  }

  if (!data.length) {
    return (
      <SectionCard title="Recent Tasks" icon={Zap}>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          No recent tasks
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent Tasks" icon={Zap}>
      <div className="space-y-1">
        {data.map((task, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-[hsl(var(--muted))]"
          >
            <div className="flex items-center gap-2">
              <StatusBadge
                status={task.Result ? "done" : "failed"}
                label={task.Result ? "OK" : "Fail"}
              />
              <span className="font-medium">{task.Name}</span>
            </div>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {task.End
                ? formatDistanceToNow(new Date(task.End), {
                    addSuffix: true,
                  })
                : "—"}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
