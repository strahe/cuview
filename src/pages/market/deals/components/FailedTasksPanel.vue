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
  <div
    v-if="failedTasks.length > 0"
    class="border-warning/40 bg-warning/5 mb-4 flex items-center gap-3 rounded-xl border px-4 py-3"
  >
    <ExclamationTriangleIcon class="text-warning size-5 flex-shrink-0" />

    <div class="flex-1 space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="text-warning text-sm font-semibold tracking-wide uppercase">
          Failed Tasks
        </h3>
        <span class="text-base-content/70 text-xs">
          {{ failedTasks.length }} issue(s) detected
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        <span
          v-for="task in failedTasks"
          :key="task.type"
          class="bg-warning/10 border-warning/40 text-warning-content/90 flex items-center gap-2 rounded-lg border px-2 py-1 text-xs"
        >
          <span class="font-semibold">{{ task.label }}</span>
          <span class="text-warning-content/70">{{ task.count }}</span>
        </span>
      </div>
    </div>

    <div class="dropdown dropdown-end">
      <button
        type="button"
        tabindex="0"
        class="btn btn-sm btn-warning text-warning-content"
        :disabled="loading"
      >
        Actions
      </button>
      <ul
        tabindex="0"
        class="dropdown-content menu bg-base-100 rounded-box border-base-300 z-[1] w-48 border p-2 shadow-lg"
      >
        <template v-for="(task, index) in failedTasks" :key="task.type">
          <li class="menu-title">
            <span class="text-xs font-semibold">{{ task.label }}</span>
          </li>
          <li>
            <button
              class="gap-2 text-sm"
              :disabled="loading"
              @click="handleRestart(task.type)"
            >
              <ArrowPathIcon class="size-4" />
              Restart
            </button>
          </li>
          <li>
            <button
              class="text-error gap-2 text-sm"
              :disabled="loading"
              @click="handleRemove(task.type)"
            >
              <TrashIcon class="size-4" />
              Remove
            </button>
          </li>
          <li v-if="index < failedTasks.length - 1" class="divider my-1"></li>
        </template>
      </ul>
    </div>
  </div>
</template>
