<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { formatDistanceToNow } from "date-fns";
import {
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import type { TaskSummary } from "@/types/task";
import { getTableRowClasses } from "@/utils/ui";

const router = useRouter();

const dropdownTrigger = ref<HTMLElement>();

interface TaskGroup {
  name: string;
  count: number;
  pendingCount: number;
  runningCount: number;
  oldestTask: Date;
  newestTask: Date;
  tasks: TaskSummary[];
}

const { data, loading, error, refresh } = useCachedQuery<TaskSummary[]>(
  "ClusterTaskSummary",
  [],
  {
    pollingInterval: 5000,
  },
);

const activeTasks = computed(() => data.value || []);
const taskCount = computed(() => activeTasks.value.length);
const hasActiveTasks = computed(() => taskCount.value > 0);

const taskGroups = computed(() => {
  const groups = new Map<string, TaskGroup>();

  activeTasks.value.forEach((task) => {
    const taskName = task.Name;

    if (!groups.has(taskName)) {
      groups.set(taskName, {
        name: taskName,
        count: 0,
        pendingCount: 0,
        runningCount: 0,
        oldestTask: new Date(task.SincePosted),
        newestTask: new Date(task.SincePosted),
        tasks: [],
      });
    }

    const group = groups.get(taskName)!;
    group.count++;
    group.tasks.push(task);

    if (task.Owner) {
      group.runningCount++;
    } else {
      group.pendingCount++;
    }

    const taskDate = new Date(task.SincePosted);
    if (taskDate < group.oldestTask) {
      group.oldestTask = taskDate;
    }
    if (taskDate > group.newestTask) {
      group.newestTask = taskDate;
    }
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.count !== b.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });
});

const formatTimeRange = (oldest: Date, newest: Date) => {
  const oldestFormatted = formatDistanceToNow(oldest, { addSuffix: true });
  const newestFormatted = formatDistanceToNow(newest, { addSuffix: true });

  if (
    oldest.getTime() === newest.getTime() ||
    oldestFormatted === newestFormatted
  ) {
    return oldestFormatted;
  }

  const oldestWithoutSuffix = formatDistanceToNow(oldest);
  const newestWithoutSuffix = formatDistanceToNow(newest);
  return `${oldestWithoutSuffix} - ${newestWithoutSuffix} ago`;
};

const handleTaskGroupClick = (taskName: string) => {
  router.push({
    path: "/tasks/active",
    query: { search: taskName },
  });
  dropdownTrigger.value?.blur();
};

const handleViewAllTasks = () => {
  router.push("/tasks/active");
  dropdownTrigger.value?.blur();
};

const handleRefresh = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  refresh();

  if (dropdownTrigger.value) {
    dropdownTrigger.value.focus();
  }
};
</script>

<template>
  <div class="dropdown dropdown-end">
    <div
      ref="dropdownTrigger"
      tabindex="0"
      role="button"
      class="btn btn-ghost btn-sm relative size-9 p-0"
      :title="`Active Tasks (${taskCount})`"
    >
      <ClipboardDocumentListIcon class="size-5" />

      <div
        v-if="taskCount > 0"
        class="bg-primary text-primary-content absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full text-xs font-semibold"
      >
        {{ taskCount > 99 ? "99+" : taskCount }}
      </div>
    </div>

    <div
      tabindex="0"
      class="dropdown-content menu rounded-box border-base-300 bg-base-100 z-[1] w-[600px] border-2 p-0 shadow-2xl"
    >
      <div
        class="border-base-300/50 flex items-center justify-between border-b p-4"
      >
        <div class="flex items-center gap-3">
          <ClipboardDocumentListIcon class="text-base-content/70 size-5" />
          <span class="text-base font-semibold">Active Tasks</span>
          <span class="text-base-content/60 text-sm"
            >({{ taskCount }} total)</span
          >
        </div>
        <button
          class="btn btn-ghost btn-sm"
          :disabled="loading"
          title="Refresh"
          @click="handleRefresh"
        >
          <ArrowPathIcon class="size-4" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div class="h-[400px] overflow-y-auto">
        <template v-if="error && !hasActiveTasks">
          <div class="p-8 text-center">
            <ExclamationTriangleIcon class="text-error mx-auto mb-3 size-12" />
            <div class="text-base-content/70 mb-4 text-base font-medium">
              Connection Error
            </div>
            <button class="btn btn-outline btn-sm" @click="handleRefresh">
              <ArrowPathIcon class="size-4" />
              Retry
            </button>
          </div>
        </template>

        <template v-else-if="loading && !hasActiveTasks">
          <div class="p-8 text-center">
            <div class="loading loading-spinner loading-lg mb-3"></div>
            <div class="text-base-content/70 text-base">Loading tasks...</div>
          </div>
        </template>

        <template v-else-if="!hasActiveTasks">
          <div class="p-8 text-center">
            <ClipboardDocumentListIcon
              class="text-base-content/30 mx-auto mb-3 size-12"
            />
            <div class="text-base-content/70 text-base font-medium">
              No active tasks
            </div>
            <div class="text-base-content/50 mt-1 text-sm">
              All systems idle
            </div>
          </div>
        </template>

        <template v-else>
          <div class="bg-base-100 flex h-full flex-col">
            <div class="bg-base-100 flex-1 overflow-x-auto">
              <table class="table-sm bg-base-100 table w-full">
                <thead class="bg-base-100 sticky top-0 z-10">
                  <tr class="border-base-300/50 bg-base-100">
                    <th class="bg-base-100 text-left font-semibold">
                      Task Type
                    </th>
                    <th class="bg-base-100 text-center font-semibold">Count</th>
                    <th class="bg-base-100 text-left font-semibold">Status</th>
                    <th class="bg-base-100 text-left font-semibold">Posted</th>
                    <th class="bg-base-100 w-8"></th>
                  </tr>
                </thead>

                <tbody class="bg-base-100">
                  <tr
                    v-for="group in taskGroups"
                    :key="group.name"
                    :class="[
                      getTableRowClasses(true),
                      'bg-base-100 border-base-300/30 hover:[&>td]:bg-base-200',
                    ]"
                    @click="handleTaskGroupClick(group.name)"
                  >
                    <td class="bg-base-100 py-3">
                      <span class="text-base-content font-medium">
                        {{ group.name }}
                      </span>
                    </td>

                    <td class="bg-base-100 py-3 text-center">
                      <span class="text-base-content font-semibold">
                        {{ group.count }}
                      </span>
                    </td>

                    <td class="bg-base-100 py-3">
                      <span class="text-base-content/70 text-sm">
                        <template
                          v-if="
                            group.runningCount > 0 && group.pendingCount > 0
                          "
                        >
                          {{ group.runningCount }} running,
                          {{ group.pendingCount }} pending
                        </template>
                        <template v-else-if="group.runningCount > 0">
                          {{ group.runningCount }} running
                        </template>
                        <template v-else-if="group.pendingCount > 0">
                          {{ group.pendingCount }} pending
                        </template>
                        <template v-else> No active tasks </template>
                      </span>
                    </td>

                    <td class="bg-base-100 py-3">
                      <span class="text-base-content/60 text-sm">
                        {{
                          formatTimeRange(group.oldestTask, group.newestTask)
                        }}
                      </span>
                    </td>

                    <td class="bg-base-100 py-3">
                      <ChevronRightIcon class="text-base-content/40 size-4" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="border-base-300/50 bg-base-200 border-t p-4">
              <button
                class="btn btn-primary btn-sm w-full"
                @click="handleViewAllTasks"
              >
                <ClipboardDocumentListIcon class="size-4" />
                View All Active Tasks
                <ChevronRightIcon class="size-4" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
