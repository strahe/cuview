<script setup lang="ts">
import { computed } from "vue";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
import { getTaskTypeName } from "@/utils/market";
import type { PipelineFailedStats, FailedTaskType } from "@/types/market";

interface Props {
  stats?: PipelineFailedStats | null;
  loading?: boolean;
}

interface Emits {
  (e: "restart", taskType: FailedTaskType): void;
  (e: "remove", taskType: FailedTaskType): void;
}

const props = withDefaults(defineProps<Props>(), {
  stats: null,
  loading: false,
});

const emit = defineEmits<Emits>();

interface FailedTaskEntry {
  type: FailedTaskType;
  count: number;
  label: string;
}

const failedTasks = computed<FailedTaskEntry[]>(() => {
  if (!props.stats) return [];

  const entries: FailedTaskEntry[] = [];

  if (props.stats.DownloadingFailed > 0) {
    entries.push({
      type: "downloading",
      count: props.stats.DownloadingFailed,
      label: getTaskTypeName("downloading"),
    });
  }

  if (props.stats.CommPFailed > 0) {
    entries.push({
      type: "commp",
      count: props.stats.CommPFailed,
      label: getTaskTypeName("commp"),
    });
  }

  if (props.stats.PSDFailed > 0) {
    entries.push({
      type: "psd",
      count: props.stats.PSDFailed,
      label: getTaskTypeName("psd"),
    });
  }

  if (props.stats.FindDealFailed > 0) {
    entries.push({
      type: "find_deal",
      count: props.stats.FindDealFailed,
      label: getTaskTypeName("find_deal"),
    });
  }

  if (props.stats.IndexFailed > 0) {
    entries.push({
      type: "index",
      count: props.stats.IndexFailed,
      label: getTaskTypeName("index"),
    });
  }

  return entries;
});

const handleRestart = (taskType: FailedTaskType) => {
  emit("restart", taskType);
};

const handleRemove = (taskType: FailedTaskType) => {
  emit("remove", taskType);
};
</script>

<template>
  <div v-if="failedTasks.length > 0" class="alert alert-warning mb-4 shadow-lg">
    <div class="flex w-full items-start gap-3">
      <ExclamationTriangleIcon class="size-6 flex-shrink-0" />

      <div class="flex-1 space-y-3">
        <div>
          <h3 class="text-lg font-semibold">Failed Tasks</h3>
          <p class="text-sm opacity-90">
            The following tasks have failed. You can choose to restart or remove
            them
          </p>
        </div>

        <div class="space-y-2">
          <div
            v-for="task in failedTasks"
            :key="task.type"
            class="bg-base-100 flex items-center justify-between gap-3 rounded-lg p-3"
          >
            <div class="flex-1">
              <span class="font-medium">{{ task.label }}</span>
              <span class="text-base-content/70 ml-2">
                Failed: {{ task.count }}
              </span>
            </div>

            <div class="flex gap-2">
              <details class="dropdown dropdown-end">
                <summary class="btn btn-sm btn-ghost gap-1" :disabled="loading">
                  <span class="text-xs">Actions</span>
                </summary>
                <ul
                  class="dropdown-content menu bg-base-100 rounded-box border-base-300 z-[1] w-40 border p-2 shadow-lg"
                >
                  <li>
                    <button
                      class="gap-2 text-sm"
                      :disabled="loading"
                      @click="handleRestart(task.type)"
                    >
                      <ArrowPathIcon class="size-4" />
                      Restart All
                    </button>
                  </li>
                  <li>
                    <button
                      class="text-error gap-2 text-sm"
                      :disabled="loading"
                      @click="handleRemove(task.type)"
                    >
                      <TrashIcon class="size-4" />
                      Remove All
                    </button>
                  </li>
                </ul>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
