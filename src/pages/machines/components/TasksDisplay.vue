<script setup lang="ts">
import { computed, ref } from "vue";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/vue/24/outline";

interface Props {
  tasks: string;
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 3,
});

const expanded = ref(false);

const taskList = computed(() => {
  if (!props.tasks) return [];
  return props.tasks
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
});

const displayedTasks = computed(() => {
  if (expanded.value) return taskList.value;
  return taskList.value.slice(0, props.limit);
});

const remainingCount = computed(() =>
  Math.max(0, taskList.value.length - props.limit),
);

const hasMoreTasks = computed(() => taskList.value.length > props.limit);

const taskBadgeColor = (task: string) => {
  // Color coding based on task type
  if (task.includes("porep") || task.includes("precommit"))
    return "badge-primary";
  if (task.includes("commit") || task.includes("prove"))
    return "badge-secondary";
  if (task.includes("finalize") || task.includes("move"))
    return "badge-success";
  if (task.includes("unseal") || task.includes("fetch")) return "badge-info";
  return "badge-ghost";
};

const toggleExpanded = () => {
  expanded.value = !expanded.value;
};
</script>

<template>
  <div class="flex flex-col gap-1">
    <template v-if="taskList.length === 0">
      <span class="text-base-content/40 text-xs">No tasks</span>
    </template>
    <template v-else>
      <!-- Task badges -->
      <div class="flex flex-wrap items-center gap-1">
        <div
          v-for="task in displayedTasks"
          :key="task"
          class="badge text-xs"
          :class="taskBadgeColor(task)"
          :title="task"
        >
          {{ task }}
        </div>

        <!-- Expand/Collapse button -->
        <button
          v-if="hasMoreTasks"
          type="button"
          class="badge badge-ghost hover:badge-secondary border-base-content/20 hover:border-secondary cursor-pointer border text-xs transition-colors"
          :title="expanded ? 'Show less' : `Show ${remainingCount} more tasks`"
          @click="toggleExpanded"
        >
          <template v-if="expanded">
            <ChevronUpIcon class="mr-1 h-3 w-3" />
            Show less
          </template>
          <template v-else>
            <ChevronDownIcon class="mr-1 h-3 w-3" />
            +{{ remainingCount }}
          </template>
        </button>
      </div>
    </template>
  </div>
</template>
