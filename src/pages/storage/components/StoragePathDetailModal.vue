<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  XMarkIcon,
  CircleStackIcon,
  ServerIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  LinkIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from "@heroicons/vue/24/outline";
import { useCurioDataStore } from "@/stores/curioData";
import { formatBytes, formatDateTime } from "@/utils/format";
import { getProgressColor } from "@/utils/ui";
import type { StoragePathInfo } from "@/types/storage";

interface Props {
  open: boolean;
  storageId: string | null;
}

interface Emits {
  (e: "update:open", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Manual data fetching to avoid null parameter issues
const detailData = ref<StoragePathInfo | null>(null);
const detailLoading = ref(false);
const detailError = ref<Error | null>(null);
const isRefreshing = ref(false);

const store = useCurioDataStore();

const refreshDetail = async () => {
  if (!props.storageId) {
    console.warn("StoragePathDetailModal: Cannot refresh with null storageId");
    return;
  }

  try {
    // Only show loading state if we don't have existing data (initial load)
    const hasExistingData = detailData.value !== null;

    if (hasExistingData) {
      isRefreshing.value = true;
    } else {
      detailLoading.value = true;
    }

    detailError.value = null;

    // Directly call the store's fetchData method with valid parameters
    await store.fetchData<StoragePathInfo>("StoragePathDetail", [
      props.storageId,
    ]);

    // Get the cached result
    const cached = store.getCachedData<StoragePathInfo>(
      `StoragePathDetail:${JSON.stringify([props.storageId])}`,
    );
    if (cached) {
      detailData.value = cached.data;
      detailError.value = cached.error;
    }
  } catch (error) {
    detailError.value = error as Error;
    // Only clear data on error if this was an initial load
    if (!detailData.value) {
      detailData.value = null;
    }
  } finally {
    detailLoading.value = false;
    isRefreshing.value = false;
  }
};

// Watch for storage ID changes to trigger data fetching
watch(
  () => [props.open, props.storageId],
  ([isOpen, storageId]) => {
    if (isOpen && storageId) {
      refreshDetail();
    } else {
      // Clear data when modal closes or storageId becomes null
      detailData.value = null;
      detailError.value = null;
      detailLoading.value = false;
      isRefreshing.value = false;
    }
  },
  { immediate: true },
);

const storageData = computed(() => detailData.value);

// Helper functions
const getHealthStatus = (
  path: StoragePathInfo | null,
): "healthy" | "warning" | "error" => {
  if (!path) return "error";

  if (path.HeartbeatErr && path.HeartbeatErr.trim() !== "") {
    return "error";
  }

  if (!path.LastHeartbeat) {
    return "error";
  }

  try {
    const heartbeatTime = new Date(path.LastHeartbeat);
    const now = new Date();
    const timeDiff = now.getTime() - heartbeatTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 30) {
      return "error";
    } else if (minutesDiff > 10) {
      return "warning";
    }

    return "healthy";
  } catch {
    return "error";
  }
};

const getUsagePercent = (path: StoragePathInfo | null): number => {
  if (!path?.Capacity || path.Capacity <= 0 || !path.Used) {
    return 0;
  }
  return Math.min((path.Used / path.Capacity) * 100, 100);
};

const formatNullableBytes = (value: number | null): string => {
  return value !== null && value !== undefined ? formatBytes(value) : "-";
};

const formatNullableDateTime = (value: string | null): string => {
  return value ? formatDateTime(value) : "-";
};

const getHealthStatusIcon = (status: string) => {
  switch (status) {
    case "healthy":
      return CheckCircleIcon;
    case "warning":
      return ExclamationTriangleIcon;
    case "error":
      return ExclamationTriangleIcon;
    default:
      return ClockIcon;
  }
};

const splitList = (value: string | null): string[] => {
  if (!value || value.trim() === "") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getCapabilityBadges = (path: StoragePathInfo | null) => {
  if (!path) return [];

  const badges = [];
  if (path.CanSeal === true) {
    badges.push({ text: "Seal", class: "badge-primary" });
  }
  if (path.CanStore === true) {
    badges.push({ text: "Store", class: "badge-secondary" });
  }
  return badges;
};

const handleClose = () => {
  emit("update:open", false);
};

// Handle escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && props.open) {
    handleClose();
  }
});
</script>

<template>
  <div v-if="open" class="modal modal-open">
    <div class="modal-box max-h-[95vh] max-w-5xl overflow-y-auto">
      <!-- Header -->
      <div class="bg-base-100 sticky top-0 z-10 mb-4 pb-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CircleStackIcon class="text-primary size-6" />
            <div>
              <h3 class="text-base-content text-lg font-bold">
                Storage Path Details
              </h3>
              <p class="text-base-content/50 font-mono text-xs">
                {{ storageId || "Storage path information" }}
              </p>
            </div>
          </div>
          <button
            class="btn btn-ghost btn-circle btn-sm hover:bg-base-200"
            title="Close"
            @click="handleClose"
          >
            <XMarkIcon class="size-5" />
          </button>
        </div>
        <div class="divider mt-2 mb-0"></div>
      </div>

      <!-- Loading State -->
      <template v-if="detailLoading">
        <div class="py-8 text-center">
          <div class="loading loading-spinner loading-lg mx-auto mb-3"></div>
          <div class="text-base-content/60 text-sm">
            Loading storage path details...
          </div>
        </div>
      </template>

      <!-- Error State -->
      <template v-else-if="detailError">
        <div class="py-8 text-center">
          <div
            class="bg-error/10 mx-auto mb-3 flex size-12 items-center justify-center rounded-full"
          >
            <ExclamationTriangleIcon class="text-error h-6 w-6" />
          </div>
          <h3 class="text-base-content mb-2 text-base font-semibold">
            Error Loading Details
          </h3>
          <p class="text-base-content/70 mb-3 text-xs">
            {{ detailError.message }}
          </p>
          <button class="btn btn-outline btn-sm" @click="refreshDetail">
            Try Again
          </button>
        </div>
      </template>

      <!-- Content -->
      <template v-else-if="storageData">
        <div class="space-y-4">
          <!-- TOP PRIORITY: Usage + Health Status Grid -->
          <div class="grid gap-4 lg:grid-cols-5">
            <!-- Usage Progress - Largest (3 columns) -->
            <div class="lg:col-span-3">
              <div
                class="from-base-200/50 to-base-300/30 rounded-lg bg-gradient-to-br p-4"
              >
                <div class="mb-2 flex items-baseline gap-2">
                  <span class="text-base-content/60 text-xs font-medium"
                    >Storage Usage</span
                  >
                  <span class="text-primary text-3xl font-bold">
                    {{ Math.round(getUsagePercent(storageData)) }}%
                  </span>
                </div>

                <div
                  v-if="storageData.Capacity && storageData.Used"
                  class="space-y-3"
                >
                  <progress
                    class="progress h-2 w-full"
                    :class="getProgressColor(getUsagePercent(storageData))"
                    :value="getUsagePercent(storageData)"
                    max="100"
                  ></progress>

                  <!-- Compact capacity info -->
                  <div class="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div class="text-base-content text-lg font-bold">
                        {{ formatBytes(storageData.Used || 0) }}
                      </div>
                      <div class="text-base-content/60 text-xs">Used</div>
                    </div>
                    <div>
                      <div class="text-success text-lg font-bold">
                        {{ formatBytes(storageData.Available || 0) }}
                      </div>
                      <div class="text-base-content/60 text-xs">Free</div>
                    </div>
                    <div>
                      <div class="text-base-content text-lg font-bold">
                        {{ formatBytes(storageData.Capacity) }}
                      </div>
                      <div class="text-base-content/60 text-xs">Total</div>
                    </div>
                  </div>
                </div>

                <div v-else class="py-4 text-center">
                  <div class="text-base-content/40 text-sm">
                    No capacity data
                  </div>
                </div>
              </div>
            </div>

            <!-- Health Status (2 columns) -->
            <div class="lg:col-span-2">
              <div class="h-full">
                <!-- Health Status -->
                <div class="mb-3 text-center">
                  <div class="text-base-content/60 mb-1 text-xs font-medium">
                    Health Status
                  </div>
                  <div
                    class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-lg font-bold"
                    :class="{
                      'bg-success/20 text-success':
                        getHealthStatus(storageData) === 'healthy',
                      'bg-warning/20 text-warning':
                        getHealthStatus(storageData) === 'warning',
                      'bg-error/20 text-error':
                        getHealthStatus(storageData) === 'error',
                    }"
                  >
                    <component
                      :is="getHealthStatusIcon(getHealthStatus(storageData))"
                      class="size-5"
                    />
                    {{
                      getHealthStatus(storageData).charAt(0).toUpperCase() +
                      getHealthStatus(storageData).slice(1)
                    }}
                  </div>
                </div>

                <!-- Capabilities & Last Heartbeat -->
                <div class="space-y-2">
                  <div class="text-center">
                    <div class="text-base-content/50 text-xs">Capabilities</div>
                    <div class="mt-1 flex justify-center gap-1">
                      <template
                        v-if="getCapabilityBadges(storageData).length > 0"
                      >
                        <div
                          v-for="badge in getCapabilityBadges(storageData)"
                          :key="badge.text"
                          class="badge badge-sm font-semibold"
                          :class="badge.class"
                        >
                          {{ badge.text }}
                        </div>
                      </template>
                      <template v-else>
                        <span class="text-base-content/50 text-xs">None</span>
                      </template>
                    </div>
                  </div>

                  <div class="text-center">
                    <div class="text-base-content/50 text-xs">
                      Last Heartbeat
                    </div>
                    <div class="text-base-content/70 text-xs font-medium">
                      {{ formatNullableDateTime(storageData.LastHeartbeat) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Information - Prominent when present -->
          <div
            v-if="
              storageData.HeartbeatErr && storageData.HeartbeatErr.trim() !== ''
            "
            class="bg-error/10 border-error/30 rounded-lg border p-3"
          >
            <div class="flex items-start gap-2">
              <ExclamationTriangleIcon
                class="text-error mt-0.5 size-4 flex-shrink-0"
              />
              <div class="flex-1">
                <div class="text-error mb-1 text-xs font-semibold">
                  Error Details
                </div>
                <div class="text-error/80 text-xs break-words">
                  {{ storageData.HeartbeatErr }}
                </div>
              </div>
            </div>
          </div>

          <!-- DENSE INFORMATION GRID: All details in compact sections -->
          <div class="grid gap-3 lg:grid-cols-2">
            <!-- Identity & Configuration -->
            <div class="bg-base-200/30 rounded-lg p-3">
              <div class="mb-3 flex items-center gap-2">
                <ServerIcon class="text-base-content/70 size-4" />
                <h4 class="text-base-content text-sm font-semibold">
                  Identity & Configuration
                </h4>
              </div>

              <div class="space-y-2">
                <!-- Storage ID -->
                <div>
                  <label class="text-base-content/60 text-xs font-medium"
                    >Storage ID</label
                  >
                  <div
                    class="text-base-content mt-0.5 truncate font-mono text-sm font-semibold"
                  >
                    {{ storageData.StorageID }}
                  </div>
                </div>

                <!-- Metrics in compact grid -->
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div class="bg-base-100/50 rounded p-2">
                    <div class="text-base-content/50 text-xs">Weight</div>
                    <div class="text-base-content/80 text-xs font-medium">
                      {{ storageData.Weight ?? "-" }}
                    </div>
                  </div>
                  <div class="bg-base-100/50 rounded p-2">
                    <div class="text-base-content/50 text-xs">Max Storage</div>
                    <div class="text-base-content/80 text-xs font-medium">
                      {{ formatNullableBytes(storageData.MaxStorage) }}
                    </div>
                  </div>
                  <div class="bg-base-100/50 rounded p-2">
                    <div class="text-base-content/50 text-xs">FS Available</div>
                    <div class="text-base-content/80 text-xs font-medium">
                      {{ formatNullableBytes(storageData.FSAvailable) }}
                    </div>
                  </div>
                </div>

                <!-- Reserved storage -->
                <div class="border-base-300/50 border-t pt-2">
                  <div class="flex justify-between text-xs">
                    <span class="text-base-content/60">Reserved:</span>
                    <span class="text-base-content/80 font-medium">
                      {{ formatNullableBytes(storageData.Reserved) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- URLs & Groups -->
            <div class="bg-base-200/30 rounded-lg p-3">
              <div class="mb-3 flex items-center gap-2">
                <LinkIcon class="text-base-content/70 size-4" />
                <h4 class="text-base-content text-sm font-semibold">
                  URLs & Groups
                </h4>
              </div>

              <div class="space-y-3">
                <!-- URLs -->
                <div>
                  <label class="text-base-content/60 text-xs font-medium"
                    >URLs</label
                  >
                  <div class="mt-1 space-y-1">
                    <template
                      v-if="
                        storageData.URLs && splitList(storageData.URLs).length
                      "
                    >
                      <div
                        v-for="url in splitList(storageData.URLs)"
                        :key="url"
                        class="bg-base-100/60 truncate rounded px-2 py-1 font-mono text-xs"
                      >
                        {{ url }}
                      </div>
                    </template>
                    <template v-else>
                      <span class="text-base-content/50 text-xs">None</span>
                    </template>
                  </div>
                </div>

                <!-- Groups -->
                <div>
                  <label class="text-base-content/60 text-xs font-medium"
                    >Groups</label
                  >
                  <div class="mt-1 flex flex-wrap gap-1">
                    <template v-if="splitList(storageData.Groups).length > 0">
                      <div
                        v-for="group in splitList(storageData.Groups)"
                        :key="group"
                        class="badge badge-outline badge-xs"
                      >
                        {{ group }}
                      </div>
                    </template>
                    <template v-else>
                      <span class="text-base-content/50 text-xs">None</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ACCESS CONTROL RULES - Dense two-column layout -->
          <div class="bg-base-200/30 rounded-lg p-3">
            <div class="mb-3 flex items-center gap-2">
              <CogIcon class="text-base-content/70 size-4" />
              <h4 class="text-base-content text-sm font-semibold">
                Access Control Rules
              </h4>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <!-- Allow Rules -->
              <div>
                <h5
                  class="text-base-content/70 mb-2 flex items-center gap-1 text-xs font-semibold"
                >
                  <ShieldCheckIcon class="text-success size-3" />
                  Allow Rules
                </h5>

                <div class="space-y-2">
                  <div>
                    <span class="text-base-content/60 text-xs">To:</span>
                    <div class="mt-0.5 flex flex-wrap gap-1">
                      <template v-if="splitList(storageData.AllowTo).length">
                        <div
                          v-for="item in splitList(storageData.AllowTo)"
                          :key="item"
                          class="badge badge-success badge-xs"
                        >
                          {{ item }}
                        </div>
                      </template>
                      <template v-else>
                        <span class="text-base-content/50 text-xs">All</span>
                      </template>
                    </div>
                  </div>

                  <div>
                    <span class="text-base-content/60 text-xs">Types:</span>
                    <div class="mt-0.5 flex flex-wrap gap-1">
                      <template v-if="splitList(storageData.AllowTypes).length">
                        <div
                          v-for="type in splitList(storageData.AllowTypes)"
                          :key="type"
                          class="badge badge-success badge-xs"
                        >
                          {{ type }}
                        </div>
                      </template>
                      <template v-else>
                        <span class="text-base-content/50 text-xs">All</span>
                      </template>
                    </div>
                  </div>

                  <div>
                    <span class="text-base-content/60 text-xs">Miners:</span>
                    <div class="mt-0.5 flex flex-wrap gap-1">
                      <template
                        v-if="splitList(storageData.AllowMiners).length"
                      >
                        <div
                          v-for="miner in splitList(storageData.AllowMiners)"
                          :key="miner"
                          class="badge badge-success badge-xs"
                        >
                          {{ miner }}
                        </div>
                      </template>
                      <template v-else>
                        <span class="text-base-content/50 text-xs">All</span>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Deny Rules -->
              <div>
                <h5
                  class="text-base-content/70 mb-2 flex items-center gap-1 text-xs font-semibold"
                >
                  <ShieldExclamationIcon class="text-error size-3" />
                  Deny Rules
                </h5>

                <div class="space-y-2">
                  <div>
                    <span class="text-base-content/60 text-xs">Types:</span>
                    <div class="mt-0.5 flex flex-wrap gap-1">
                      <template v-if="splitList(storageData.DenyTypes).length">
                        <div
                          v-for="type in splitList(storageData.DenyTypes)"
                          :key="type"
                          class="badge badge-error badge-xs"
                        >
                          {{ type }}
                        </div>
                      </template>
                      <template v-else>
                        <span class="text-base-content/50 text-xs">None</span>
                      </template>
                    </div>
                  </div>

                  <div>
                    <span class="text-base-content/60 text-xs">Miners:</span>
                    <div class="mt-0.5 flex flex-wrap gap-1">
                      <template v-if="splitList(storageData.DenyMiners).length">
                        <div
                          v-for="miner in splitList(storageData.DenyMiners)"
                          :key="miner"
                          class="badge badge-error badge-xs"
                        >
                          {{ miner }}
                        </div>
                      </template>
                      <template v-else>
                        <span class="text-base-content/50 text-xs">None</span>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- No Data State -->
      <template v-else>
        <div class="py-8 text-center">
          <CircleStackIcon class="text-base-content/20 mx-auto mb-2 h-8 w-8" />
          <div class="text-base-content/60 text-sm">
            No storage path data available
          </div>
        </div>
      </template>

      <!-- Actions -->
      <div
        class="bg-base-100 border-base-300/50 sticky bottom-0 mt-4 border-t pt-3"
      >
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="btn btn-outline btn-sm px-6"
            @click="handleClose"
          >
            Close
          </button>
          <button
            v-if="storageData"
            type="button"
            class="btn btn-primary btn-sm px-6"
            :disabled="detailLoading || isRefreshing"
            @click="refreshDetail"
          >
            <template v-if="isRefreshing">
              <span class="loading loading-spinner loading-xs"></span>
              <span class="ml-1">Refreshing...</span>
            </template>
            <template v-else>
              <svg
                class="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span class="ml-1">Refresh</span>
            </template>
          </button>
        </div>
      </div>
    </div>
    <div class="modal-backdrop" @click="handleClose"></div>
  </div>
</template>
