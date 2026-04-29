import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { StatusBadge } from "@/components/composed/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_TASK_SEARCH } from "@/routes/_app/tasks/-module/search-state";
import type { TaskHistorySummary } from "@/types/task";
import {
  OverviewEmpty,
  OverviewList,
  OverviewSection,
  overviewActionClassName,
} from "./overview-section";

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
      <OverviewSection title="Recent Tasks" icon={Zap}>
        <OverviewList className="gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </OverviewList>
      </OverviewSection>
    );
  }

  if (error) {
    return (
      <OverviewSection title="Recent Tasks" icon={Zap}>
        <Alert variant="destructive">
          <AlertTitle>Failed to load recent tasks</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </OverviewSection>
    );
  }

  if (!data.length) {
    return (
      <OverviewSection title="Recent Tasks" icon={Zap}>
        <OverviewEmpty>No recent tasks</OverviewEmpty>
      </OverviewSection>
    );
  }

  return (
    <OverviewSection
      title="Recent Tasks"
      icon={Zap}
      action={
        <Link
          to="/tasks/history"
          search={DEFAULT_TASK_SEARCH}
          className={overviewActionClassName}
        >
          View all
        </Link>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Executor</TableHead>
            <TableHead>Posted</TableHead>
            <TableHead>Queued</TableHead>
            <TableHead>Took</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 10).map((task) => (
            <TableRow key={task.TaskID}>
              <TableCell>
                <StatusBadge
                  status={task.Result ? "done" : "failed"}
                  label={task.Result ? "OK" : "Fail"}
                />
              </TableCell>
              <TableCell className="max-w-[14rem] truncate font-medium">
                {task.Name}
              </TableCell>
              <TableCell className="max-w-[10rem] truncate text-muted-foreground">
                {task.CompletedBy || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {task.Posted || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {task.Queued || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {task.Took || "-"}
              </TableCell>
              <TableCell
                className="max-w-[12rem] truncate text-destructive"
                title={task.Err || ""}
              >
                {task.Err || ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </OverviewSection>
  );
}
