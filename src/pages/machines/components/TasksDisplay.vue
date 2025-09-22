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
        <span
          v-for="task in displayedTasks"
          :key="task"
          class="badge badge-outline text-xs"
          :title="task"
        >
          {{ task }}
        </span>

        <!-- Expand/Collapse button -->
        <button
          v-if="hasMoreTasks"
          type="button"
          class="badge badge-outline hover:bg-base-200 no-row-click cursor-pointer text-xs transition-colors"
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
