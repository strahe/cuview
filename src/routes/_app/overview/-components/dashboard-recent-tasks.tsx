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
        <p className="text-sm text-destructive">Failed to load recent tasks</p>
      </SectionCard>
    );
  }

  if (!data.length) {
    return (
      <SectionCard title="Recent Tasks" icon={Zap}>
        <p className="text-sm text-muted-foreground">No recent tasks</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent Tasks" icon={Zap}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 pr-3 font-medium">Name</th>
              <th className="pb-2 pr-3 font-medium">Executor</th>
              <th className="pb-2 pr-3 font-medium">Posted</th>
              <th className="pb-2 pr-3 font-medium">Queued</th>
              <th className="pb-2 pr-3 font-medium">Took</th>
              <th className="pb-2 font-medium">Error</th>
            </tr>
          </thead>
          <tbody>
            {data.map((task) => (
              <tr
                key={task.TaskID}
                className="border-b border-border/50 last:border-0 hover:bg-muted/50"
              >
                <td className="py-1.5 pr-3">
                  <StatusBadge
                    status={task.Result ? "done" : "failed"}
                    label={task.Result ? "OK" : "Fail"}
                  />
                </td>
                <td className="py-1.5 pr-3 font-medium">{task.Name}</td>
                <td className="py-1.5 pr-3 text-muted-foreground">
                  {task.CompletedBy || "—"}
                </td>
                <td className="py-1.5 pr-3 text-xs text-muted-foreground">
                  {task.Posted || "—"}
                </td>
                <td className="py-1.5 pr-3 text-xs text-muted-foreground">
                  {task.Queued || "—"}
                </td>
                <td className="py-1.5 pr-3 text-xs text-muted-foreground">
                  {task.Took || "—"}
                </td>
                <td className="max-w-[200px] truncate py-1.5 text-xs text-destructive">
                  {task.Err || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
