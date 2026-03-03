import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { SectionCard } from "@/components/composed/section-card";
import { DataTable } from "@/components/table/data-table";
import { taskQueueColumns } from "@/routes/_app/tasks/-components/task-columns";
import { TaskDetailPanel } from "@/routes/_app/tasks/-components/task-detail-panel";
import { useTasksLayoutControls } from "@/routes/_app/tasks/-components/tasks-layout-controls";
import { TasksOverlayDrawer } from "@/routes/_app/tasks/-components/tasks-overlay-drawer";
import { TasksToolbar } from "@/routes/_app/tasks/-components/tasks-toolbar";
import {
  buildCoalescedQueueRows,
  filterTaskSummaryRows,
} from "./-module/filters";
import { useTaskSummary } from "./-module/queries";
import {
  DEFAULT_TASK_SEARCH,
  normalizeTaskSearch,
  patchTaskSearch,
} from "./-module/search-state";
import type { TaskSearchPatch } from "./-module/types";

export const Route = createFileRoute("/_app/tasks/active")({
  validateSearch: (search) => normalizeTaskSearch(search),
  component: ActiveTasksPage,
});

export function ActiveTasksPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, isLoading } = useTaskSummary();

  const updateSearch = useCallback(
    (patch: TaskSearchPatch) => {
      navigate({
        search: (prev) => patchTaskSearch(prev, patch),
        replace: true,
      });
    },
    [navigate],
  );

  const filteredRows = useMemo(
    () =>
      filterTaskSummaryRows(data, {
        q: search.q,
        showBg: search.showBg,
        taskType: search.taskType,
      }),
    [data, search.q, search.showBg, search.taskType],
  );

  const queueRows = useMemo(() => {
    if (search.coalesce) return buildCoalescedQueueRows(filteredRows);
    return filteredRows.map((task) => ({
      kind: "task" as const,
      id: `task-${task.id}`,
      task,
    }));
  }, [filteredRows, search.coalesce]);

  const selectedTaskType =
    search.taskId !== null
      ? (data.find((task) => task.id === search.taskId)?.name ??
        search.taskType)
      : "";

  const controls = useMemo(
    () => (
      <TasksToolbar
        q={search.q}
        onQueryChange={(value) => updateSearch({ q: value })}
        result={search.result}
        showBg={search.showBg}
        onShowBgChange={(value) => updateSearch({ showBg: value })}
        coalesce={search.coalesce}
        onCoalesceChange={(value) => updateSearch({ coalesce: value })}
        onReset={() =>
          updateSearch({
            q: DEFAULT_TASK_SEARCH.q,
            showBg: DEFAULT_TASK_SEARCH.showBg,
            coalesce: DEFAULT_TASK_SEARCH.coalesce,
            taskId: null,
            taskType: "",
          })
        }
        minimal
      />
    ),
    [search.q, search.result, search.showBg, search.coalesce, updateSearch],
  );

  useTasksLayoutControls(controls);

  return (
    <>
      <SectionCard
        title="Active Queue"
        tooltip="Execution queue for active tasks."
      >
        <DataTable
          columns={taskQueueColumns}
          data={queueRows}
          loading={isLoading}
          emptyMessage="No active tasks."
          onRowClick={(row) => {
            if (row.kind !== "task") return;
            updateSearch({ taskId: row.task.id, taskType: row.task.name });
          }}
        />
      </SectionCard>

      <TasksOverlayDrawer
        open={search.taskId !== null}
        onOpenChange={(open) => {
          if (open) return;
          updateSearch({ taskId: null, taskType: "" });
        }}
        title={
          search.taskId !== null ? `Task #${search.taskId}` : "Task Detail"
        }
        description="Task status and execution history."
      >
        <TaskDetailPanel
          taskId={search.taskId}
          taskType={selectedTaskType}
          embedded
        />
      </TasksOverlayDrawer>
    </>
  );
}
