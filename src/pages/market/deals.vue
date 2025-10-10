<!-- eslint-disable vue/multi-word-component-names -->
<route>
{
  "meta": {
    "title": "Market Deals"
  }
}
</route>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useLazyQuery } from "@/composables/useLazyQuery";
import SectionCard from "@/components/ui/SectionCard.vue";
import MarketLayout from "./components/MarketLayout.vue";
import FailedTasksPanel from "./deals/components/FailedTasksPanel.vue";
import DealPipelinesTable from "./deals/components/DealPipelinesTable.vue";
import PendingDealsTable from "./deals/components/PendingDealsTable.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import { getTaskTypeName } from "@/utils/market";
import type {
  MK12Pipeline,
  PipelineFailedStats,
  FailedTaskType,
  OpenDealInfo,
} from "@/types/market";

// Deal Pipelines
const {
  data: pipelines,
  loading: pipelinesLoading,
  error: pipelinesError,
  refresh: refreshPipelines,
} = useCachedQuery<MK12Pipeline[]>("GetMK12DealPipelines", [25, 0], {
  pollingInterval: 5000,
});

const {
  data: pendingDeals,
  loading: pendingDealsLoading,
  error: pendingDealsError,
  refresh: refreshPendingDeals,
} = useCachedQuery<OpenDealInfo[]>("DealsPending", [], {
  pollingInterval: 30000,
});

const {
  data: failedStats,
  loading: failedStatsLoading,
  refresh: refreshFailedStats,
} = useCachedQuery<PipelineFailedStats>("PipelineFailedTasksMarket", [], {
  pollingInterval: 5000,
});

const { loading: restartLoading, execute: executeRestart } = useLazyQuery<void>(
  "BulkRestartFailedMarketTasks",
);

const { loading: removeLoading, execute: executeRemove } = useLazyQuery<void>(
  "BulkRemoveFailedMarketPipelines",
);

const { loading: sealNowLoading, execute: executeSealNow } =
  useLazyQuery<void>("DealsSealNow");

const showConfirmDialog = ref(false);
const confirmAction = ref<"restart" | "remove" | "seal-now">("restart");
const selectedTaskType = ref<FailedTaskType | null>(null);
const selectedSealNowDeal = ref<{
  spId: number;
  sectorNumber: number;
  miner?: string;
} | null>(null);
const operationError = ref<string | null>(null);

const operationLoading = computed(
  () => restartLoading.value || removeLoading.value || sealNowLoading.value,
);

const handleRestartRequest = (taskType: FailedTaskType) => {
  selectedTaskType.value = taskType;
  confirmAction.value = "restart";
  operationError.value = null;
  showConfirmDialog.value = true;
};

const handleRemoveRequest = (taskType: FailedTaskType) => {
  selectedTaskType.value = taskType;
  confirmAction.value = "remove";
  operationError.value = null;
  showConfirmDialog.value = true;
};

const handleSealNowRequest = (payload: {
  spId: number;
  sectorNumber: number;
}) => {
  const deal = pendingDeals.value?.find(
    (d) => d.Actor === payload.spId && d.SectorNumber === payload.sectorNumber,
  );

  selectedSealNowDeal.value = {
    spId: payload.spId,
    sectorNumber: payload.sectorNumber,
    miner: deal?.Miner,
  };
  confirmAction.value = "seal-now";
  operationError.value = null;
  showConfirmDialog.value = true;
};

const handleConfirmAction = async () => {
  const action = confirmAction.value;

  try {
    operationError.value = null;

    if (action === "seal-now") {
      if (!selectedSealNowDeal.value) {
        return;
      }
      await executeSealNow(
        selectedSealNowDeal.value.spId,
        selectedSealNowDeal.value.sectorNumber,
      );
      await refreshPendingDeals();
    } else {
      if (!selectedTaskType.value) {
        return;
      }
      const taskType = selectedTaskType.value;

      if (action === "restart") {
        await executeRestart(taskType);
      } else {
        await executeRemove(taskType);
      }

      await refreshPipelines();
      await refreshFailedStats();
    }

    showConfirmDialog.value = false;
    selectedTaskType.value = null;
    selectedSealNowDeal.value = null;
  } catch (error) {
    operationError.value =
      error instanceof Error ? error.message : `Operation failed: ${action}`;
  }
};

const handleCancelAction = () => {
  showConfirmDialog.value = false;
  selectedTaskType.value = null;
  selectedSealNowDeal.value = null;
  operationError.value = null;
};

const getConfirmationProps = () => {
  const action = confirmAction.value;

  if (action === "seal-now") {
    if (!selectedSealNowDeal.value) {
      return {
        title: "",
        message: "",
        confirmText: "",
        type: "warning" as const,
      };
    }
    const { sectorNumber, miner } = selectedSealNowDeal.value;
    const minerDisplay = miner || `SP ${selectedSealNowDeal.value.spId}`;
    return {
      title: "Confirm Seal Now",
      message: `Are you sure you want to seal Sector ${sectorNumber} (${minerDisplay}) now? This operation cannot be undone.`,
      confirmText: "Confirm Seal",
      type: "warning" as const,
    };
  } else {
    if (!selectedTaskType.value) {
      return {
        title: "",
        message: "",
        confirmText: "",
        type: "warning" as const,
      };
    }

    const taskTypeName = getTaskTypeName(selectedTaskType.value);

    if (action === "restart") {
      return {
        title: "Restart Failed Tasks",
        message: `Are you sure you want to restart all failed ${taskTypeName} tasks? This will re-execute all failed tasks.`,
        confirmText: "Restart",
        type: "warning" as const,
      };
    } else {
      return {
        title: "Remove Failed Pipelines",
        message: `Are you sure you want to remove all failed ${taskTypeName} pipelines? This operation cannot be undone.`,
        confirmText: "Remove",
        type: "danger" as const,
      };
    }
  }
};

const handleRefreshDeals = () => {
  refreshPipelines();
  refreshFailedStats();
};

const clearError = () => {
  operationError.value = null;
};
</script>

<template>
  <MarketLayout current-tab="deals">
    <div class="space-y-6">
      <!-- Pending Deals -->
      <SectionCard title="Pending Deals" tooltip="Deals waiting to be sealed">
        <PendingDealsTable
          :items="pendingDeals || []"
          :loading="pendingDealsLoading"
          :error="pendingDealsError"
          :on-refresh="refreshPendingDeals"
          @seal-now="handleSealNowRequest"
        />
      </SectionCard>

      <!-- Deal Pipelines -->
      <SectionCard title="Deal Pipelines" tooltip="Pipeline processing status">
        <!-- Operation Error Alert -->
        <div v-if="operationError" class="alert alert-error mb-4 shadow-lg">
          <div class="flex w-full items-start justify-between">
            <div>
              <h3 class="font-semibold">Operation Failed</h3>
              <p class="mt-1 text-sm">{{ operationError }}</p>
            </div>
            <button class="btn btn-ghost btn-sm btn-circle" @click="clearError">
              ×
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <FailedTasksPanel
            :stats="failedStats || undefined"
            :loading="failedStatsLoading || operationLoading"
            @restart="handleRestartRequest"
            @remove="handleRemoveRequest"
          />

          <DealPipelinesTable
            :items="pipelines || []"
            :loading="pipelinesLoading"
            :error="pipelinesError"
            :on-refresh="handleRefreshDeals"
          />
        </div>
      </SectionCard>

      <!-- Confirmation Dialog -->
      <ConfirmationDialog
        v-model:show="showConfirmDialog"
        v-bind="getConfirmationProps()"
        :loading="operationLoading"
        @confirm="handleConfirmAction"
        @cancel="handleCancelAction"
      />
    </div>
  </MarketLayout>
</template>
