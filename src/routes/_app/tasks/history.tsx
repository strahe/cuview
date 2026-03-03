import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { SectionCard } from "@/components/composed/section-card";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { taskHistoryColumns } from "@/routes/_app/tasks/-components/task-columns";
import { TaskDetailPanel } from "@/routes/_app/tasks/-components/task-detail-panel";
import { useTasksLayoutControls } from "@/routes/_app/tasks/-components/tasks-layout-controls";
import { TasksOverlayDrawer } from "@/routes/_app/tasks/-components/tasks-overlay-drawer";
import { TasksToolbar } from "@/routes/_app/tasks/-components/tasks-toolbar";
import { filterTaskHistoryRows } from "./-module/filters";
import { useTaskHistory } from "./-module/queries";
import {
  DEFAULT_TASK_SEARCH,
  normalizeTaskSearch,
  patchTaskSearch,
} from "./-module/search-state";
import type { TaskSearchPatch } from "./-module/types";

export const Route = createFileRoute("/_app/tasks/history")({
  validateSearch: (search) => normalizeTaskSearch(search),
  component: TaskHistoryPage,
});

export function TaskHistoryPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, isLoading } = useTaskHistory(search.limit, search.offset);

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
      filterTaskHistoryRows(data, {
        q: search.q,
        result: search.result,
        taskType: search.taskType,
      }),
    [data, search.q, search.result, search.taskType],
  );

  const hasPrev = search.offset > 0;
  const hasNext = data.length >= search.limit;
  const pageInfo = data.length
    ? `Rows ${search.offset + 1}-${search.offset + data.length}`
    : "Rows 0";

  const selectedTaskType =
    search.taskId !== null
      ? (data.find((task) => task.taskId === search.taskId)?.name ??
        search.taskType)
      : "";

  const controls = useMemo(
    () => (
      <TasksToolbar
        q={search.q}
        onQueryChange={(value) => updateSearch({ q: value })}
        result={search.result}
        onResultChange={(value) => updateSearch({ result: value })}
        limit={search.limit}
        onLimitChange={(value) => updateSearch({ limit: value })}
        pageInfo={pageInfo}
        onReset={() =>
          updateSearch({
            q: DEFAULT_TASK_SEARCH.q,
            result: DEFAULT_TASK_SEARCH.result,
            limit: DEFAULT_TASK_SEARCH.limit,
            offset: DEFAULT_TASK_SEARCH.offset,
            taskId: null,
            taskType: "",
          })
        }
        extraActions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() =>
                updateSearch({
                  offset: Math.max(search.offset - search.limit, 0),
                })
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() =>
                updateSearch({
                  offset: search.offset + search.limit,
                })
              }
            >
              Next
            </Button>
          </>
        }
        minimal
      />
    ),
    [
      hasNext,
      hasPrev,
      search.limit,
      search.offset,
      search.q,
      search.result,
      pageInfo,
      updateSearch,
    ],
  );

  useTasksLayoutControls(controls);

  return (
    <>
      <SectionCard title="Task Timeline">
        <DataTable
          columns={taskHistoryColumns}
          data={filteredRows}
          loading={isLoading}
          emptyMessage="No task history."
          pagination={false}
          onRowClick={(row) =>
            updateSearch({
              taskId: row.taskId,
              taskType: row.name,
            })
          }
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
