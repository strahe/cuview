<script setup lang="ts">
import { computed, ref } from "vue";
import { InformationCircleIcon } from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import PdpPipelinesTable from "./PdpPipelinesTable.vue";
import PdpFailedTasksPanel from "./PdpFailedTasksPanel.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useLazyQuery } from "@/composables/useLazyQuery";
import { usePdpPipelines } from "../composables/usePdpPipelines";
import { getPdpTaskTypeName } from "@/utils/pdp";
import type { PdpPipelineFailedStats, PdpFailedTaskType } from "../types";

const {
  data,
  totalItems,
  loading,
  error,
  hasMore,
  loadingMore,
  paginationError,
  loadMore,
  retryPagination,
  refresh,
} = usePdpPipelines({
  batchSize: 50,
  initialBatches: 2,
  immediate: true,
  maxItems: 2000,
});

const pipelines = computed(() => data.value);

const {
  data: failedStatsData,
  loading: failedStatsLoading,
  error: failedStatsError,
  refresh: refreshFailedStats,
} = useCachedQuery<PdpPipelineFailedStats>("MK20PDPPipelineFailedTasks", [], {
  pollingInterval: 30000,
});

const failedStats = computed(() => failedStatsData.value ?? undefined);

const restartFailedTasks = useLazyQuery<void>("MK20BulkRestartFailedPDPTasks");
const removeFailedPipelines = useLazyQuery<void>(
  "MK20BulkRemoveFailedPDPPipelines",
);

const operationLoading = computed(
  () => restartFailedTasks.loading.value || removeFailedPipelines.loading.value,
);

const operationError = ref<string | null>(null);
const selectedTaskType = ref<PdpFailedTaskType | null>(null);
const actionMode = ref<"restart" | "remove" | null>(null);
const showConfirmDialog = ref(false);

const handleRefreshAll = async () => {
  await Promise.all([refresh(), refreshFailedStats()]);
};

const handleRestartRequest = (taskType: PdpFailedTaskType) => {
  actionMode.value = "restart";
  selectedTaskType.value = taskType;
  showConfirmDialog.value = true;
  operationError.value = null;
};

const handleRemoveRequest = (taskType: PdpFailedTaskType) => {
  actionMode.value = "remove";
  selectedTaskType.value = taskType;
  showConfirmDialog.value = true;
  operationError.value = null;
};

const handleCancelAction = () => {
  showConfirmDialog.value = false;
  actionMode.value = null;
  selectedTaskType.value = null;
};

const handleConfirmAction = async () => {
  if (!selectedTaskType.value || !actionMode.value) {
    return;
  }

  operationError.value = null;

  try {
    if (actionMode.value === "restart") {
      await restartFailedTasks.execute(selectedTaskType.value);
    } else {
      await removeFailedPipelines.execute(selectedTaskType.value);
    }

    await Promise.all([refresh(), refreshFailedStats()]);
    handleCancelAction();
  } catch (err) {
    operationError.value =
      err instanceof Error ? err.message : String(err ?? "Unknown error");
  }
};

const getConfirmationProps = computed(() => {
  if (!selectedTaskType.value || !actionMode.value) {
    return {
      title: "",
      message: "",
      confirmText: "",
      type: "info" as const,
    };
  }

  const taskLabel = getPdpTaskTypeName(selectedTaskType.value);

  if (actionMode.value === "restart") {
    return {
      title: "Restart Failed Tasks",
      message: `Are you sure you want to restart all failed ${taskLabel} tasks?`,
      confirmText: "Restart",
      type: "info" as const,
    };
  }

  return {
    title: "Remove Failed Pipelines",
    message: `Are you sure you want to remove all failed ${taskLabel} pipelines? This cannot be undone.`,
    confirmText: "Remove",
    type: "danger" as const,
  };
});
</script>

<template>
  <SectionCard
    title="PDP Pipelines"
    :icon="InformationCircleIcon"
    tooltip="Active PDP pipelines with live progress tracking. Scroll to load additional pipelines."
    :loading="loading"
  >
    <div class="space-y-4">
      <div v-if="failedStatsError" class="alert alert-warning shadow-lg">
        <span>
          Failed to load failed task statistics:
          {{ failedStatsError.message }}
        </span>
        <button
          class="btn btn-sm"
          :disabled="failedStatsLoading"
          @click="refreshFailedStats"
        >
          Retry
        </button>
      </div>

      <div v-if="operationError" class="alert alert-error shadow-lg">
        <span>{{ operationError }}</span>
        <button class="btn btn-sm" @click="operationError = null">
          Dismiss
        </button>
      </div>

      <PdpFailedTasksPanel
        :stats="failedStats"
        :loading="operationLoading || failedStatsLoading"
        @restart="handleRestartRequest"
        @remove="handleRemoveRequest"
      />

      <PdpPipelinesTable
        :items="pipelines"
        :loading="loading"
        :error="error"
        :total-items="totalItems"
        :has-more="hasMore"
        :loading-more="loadingMore"
        :pagination-error="paginationError"
        @refresh="handleRefreshAll"
        @load-more="loadMore"
        @retry-pagination="retryPagination"
      />
    </div>

    <ConfirmationDialog
      v-model:show="showConfirmDialog"
      v-bind="getConfirmationProps"
      :loading="operationLoading"
      @confirm="handleConfirmAction"
      @cancel="handleCancelAction"
    />
  </SectionCard>
</template>
