import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { SectionCard } from "@/components/composed/section-card";
import { DataTable } from "@/components/table/data-table";
import { cn } from "@/lib/utils";
import { taskTypeColumns } from "@/routes/_app/tasks/-components/task-columns";
import { useTasksLayoutControls } from "@/routes/_app/tasks/-components/tasks-layout-controls";
import { TasksOverlayDrawer } from "@/routes/_app/tasks/-components/tasks-overlay-drawer";
import { TasksToolbar } from "@/routes/_app/tasks/-components/tasks-toolbar";
import { TaskTypePanel } from "./-components/task-type-panel";
import { filterTaskStatRows } from "./-module/filters";
import { useTaskStats } from "./-module/queries";
import {
  DEFAULT_TASK_SEARCH,
  normalizeTaskSearch,
  patchTaskSearch,
} from "./-module/search-state";
import type { TaskSearchPatch } from "./-module/types";

export const Route = createFileRoute("/_app/tasks/analysis")({
  validateSearch: (search) => normalizeTaskSearch(search),
  component: TaskAnalysisPage,
});

function clickableCardClass(active: boolean): string {
  return cn(
    "rounded-xl border bg-card p-5 text-left transition-colors",
    active ? "border-primary shadow-sm" : "hover:border-primary/40",
  );
}

export function TaskAnalysisPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, isLoading } = useTaskStats();

  const updateSearch = useCallback(
    (patch: TaskSearchPatch) => {
      navigate({
        search: (prev) => patchTaskSearch(prev, patch),
        replace: true,
      });
    },
    [navigate],
  );

  const metrics = useMemo(() => {
    return data.reduce(
      (acc, row) => {
        acc.total += row.totalCount;
        acc.success += row.trueCount;
        acc.failed += row.falseCount;
        return acc;
      },
      { total: 0, success: 0, failed: 0 },
    );
  }, [data]);

  const filteredRows = useMemo(() => {
    return filterTaskStatRows(data, {
      q: search.q,
      result: search.result,
    });
  }, [data, search.q, search.result]);

  const controls = useMemo(
    () => (
      <TasksToolbar
        q={search.q}
        onQueryChange={(value) => updateSearch({ q: value })}
        result={search.result}
        onResultChange={(value) => updateSearch({ result: value })}
        onReset={() =>
          updateSearch({
            q: DEFAULT_TASK_SEARCH.q,
            result: DEFAULT_TASK_SEARCH.result,
            taskType: "",
            taskId: null,
          })
        }
        minimal
      />
    ),
    [search.q, search.result, updateSearch],
  );

  useTasksLayoutControls(controls);

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            className={clickableCardClass(search.result === "all")}
            onClick={() => updateSearch({ result: "all" })}
          >
            <p className="text-sm text-muted-foreground">24h Runs</p>
            <p className="text-2xl font-bold">{metrics.total}</p>
          </button>
          <button
            type="button"
            className={clickableCardClass(search.result === "success")}
            onClick={() => updateSearch({ result: "success" })}
          >
            <p className="text-sm text-muted-foreground">Succeeded</p>
            <p className="text-2xl font-bold text-success">{metrics.success}</p>
          </button>
          <button
            type="button"
            className={clickableCardClass(search.result === "failed")}
            onClick={() => updateSearch({ result: "failed" })}
          >
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-destructive">
              {metrics.failed}
            </p>
          </button>
        </div>

        <SectionCard title="Task Type Analysis">
          <DataTable
            columns={taskTypeColumns}
            data={filteredRows}
            loading={isLoading}
            emptyMessage="No task stats found."
            onRowClick={(row) =>
              updateSearch({
                taskType: row.name,
                taskId: null,
              })
            }
          />
        </SectionCard>
      </div>

      <TasksOverlayDrawer
        open={Boolean(search.taskType)}
        onOpenChange={(open) => {
          if (open) return;
          updateSearch({ taskType: "", taskId: null });
        }}
        size="analysis"
        title={
          search.taskType ? `Task Type: ${search.taskType}` : "Task Type Detail"
        }
        description="Machine coverage, recent runs, and recent failures."
      >
        <TaskTypePanel taskType={search.taskType} />
      </TasksOverlayDrawer>
    </>
  );
}
