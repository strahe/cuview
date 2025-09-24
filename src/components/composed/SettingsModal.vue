<script setup lang="ts">
import { ref, watch } from "vue";
import { useConfigStore } from "@/stores/config";
import { useDebugStore } from "@/stores/debug";
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";
import BaseModal from "@/components/ui/BaseModal.vue";

interface Props {
  open: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const configStore = useConfigStore();
const debugStore = useDebugStore();
const endpointInput = ref("");
const isLoading = ref(false);
const error = ref("");
const showSuccess = ref(false);
const showTooltip = ref(false);
const tooltipPosition = ref({ x: 0, y: 0 });
const isDev = import.meta.env.DEV;

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      endpointInput.value = configStore.getEndpoint();
      error.value = "";
      showSuccess.value = false;
    } else {
      showSuccess.value = false;
    }
  },
);

const validateEndpoint = (endpoint: string): boolean => {
  if (!endpoint.trim()) return false;

  try {
    if (endpoint.startsWith("/")) return true;

    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      new URL(endpoint);
      return true;
    }

    if (endpoint.startsWith("ws://") || endpoint.startsWith("wss://")) {
      const httpUrl = endpoint.replace(/^wss?:/, "http:");
      new URL(httpUrl);
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

const normalizeEndpoint = (endpoint: string): string => {
  if (endpoint.startsWith("/")) return endpoint;

  if (endpoint.startsWith("http://")) {
    return endpoint.replace("http://", "ws://");
  }

  if (endpoint.startsWith("https://")) {
    return endpoint.replace("https://", "wss://");
  }

  return endpoint;
};

const testConnection = async (endpoint: string): Promise<boolean> => {
  if (!validateEndpoint(endpoint)) {
    return false;
  }

  try {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const { testEndpointConnection } = await import("@/utils/testConnection");
    return await testEndpointConnection(normalizedEndpoint, 8000);
  } catch {
    return false;
  }
};

const handleSave = async () => {
  if (!endpointInput.value.trim()) {
    error.value = "Please enter a Curio API endpoint";
    return;
  }

  isLoading.value = true;
  error.value = "";

  try {
    const isConnectionValid = await testConnection(endpointInput.value);

    if (isConnectionValid) {
      const normalizedEndpoint = normalizeEndpoint(endpointInput.value);
      configStore.setEndpoint(normalizedEndpoint);
      showSuccess.value = true;
    } else {
      error.value =
        "Cannot connect to Curio server. Please verify the endpoint and server status.";
    }
  } catch {
    error.value =
      "Connection test failed. Please check your network connection.";
  } finally {
    isLoading.value = false;
  }
};

const handleClose = () => {
  emit("update:open", false);
};

const defaultEndpoint = import.meta.env.VITE_CURIO_ENDPOINT || "/api/webrpc/v0";

const resetToDefault = () => {
  endpointInput.value = defaultEndpoint;
  error.value = "";
};

const toggleTooltip = (event: Event) => {
  if (showTooltip.value) {
    showTooltip.value = false;
    return;
  }

  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();

  // Position tooltip above and to the right to avoid modal clipping
  tooltipPosition.value = {
    x: rect.left + rect.width + 8,
    y: rect.top - 10,
  };

  showTooltip.value = true;
};

const showTooltipInfo = (event: Event) => {
  if (showTooltip.value) return; // Don't show hover if already clicked

  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();

  tooltipPosition.value = {
    x: rect.left + rect.width + 8,
    y: rect.top - 10,
  };

  showTooltip.value = true;
};

const hideTooltip = () => {
  showTooltip.value = false;
};

const handleClickOutside = () => {
  showTooltip.value = false;
};
</script>

<template>
  <BaseModal
    :open="open"
    title="Settings"
    size="md"
    @close="handleClose"
    @click="handleClickOutside"
  >
    <div class="space-y-4">
      <div>
        <div class="mb-3">
          <label class="flex items-center gap-2 text-sm font-medium">
            <Cog6ToothIcon class="text-base-content size-4" />
            <span>API Endpoint</span>
            <span class="badge badge-outline badge-sm">Required</span>
            <div class="relative">
              <div
                tabindex="0"
                role="button"
                class="btn btn-ghost btn-xs btn-circle"
                @click="toggleTooltip"
                @mouseenter="showTooltipInfo"
                @mouseleave="hideTooltip"
              >
                <InformationCircleIcon class="text-base-content/60 size-4" />
              </div>
            </div>
          </label>
        </div>

        <div class="relative">
          <input
            v-model="endpointInput"
            type="text"
            placeholder="/api/webrpc/v0"
            class="input input-bordered w-full"
            :class="{
              'input-error': error,
              'input-success': showSuccess,
            }"
            :disabled="isLoading"
            @keyup.enter="handleSave"
          />
          <div
            v-if="showSuccess"
            class="absolute top-1/2 right-3 -translate-y-1/2"
          >
            <CheckCircleIcon class="text-success size-4" />
          </div>
        </div>

        <div class="mt-3 space-y-3">
          <div class="alert alert-warning py-2">
            <ExclamationTriangleIcon class="size-4" />
            <div class="text-sm">
              <strong>Security Notice:</strong> No authentication required. Use
              only on trusted networks.
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              :disabled="isLoading"
              @click="resetToDefault"
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>

      <div v-if="error" class="alert alert-error py-2">
        <ExclamationTriangleIcon class="size-4" />
        <div class="text-sm">{{ error }}</div>
      </div>

      <div v-if="showSuccess" class="alert alert-success py-2">
        <CheckCircleIcon class="size-4" />
        <div class="text-sm">Configuration saved successfully!</div>
      </div>

      <div v-if="isDev" class="border-t pt-4">
        <div class="mb-3 flex items-center gap-3">
          <span class="text-sm font-medium">Network Debug Mode</span>
          <span class="badge badge-warning badge-sm">DEV</span>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-base-content/60 text-xs">
            Simulate network conditions for testing
          </div>
          <input
            v-model="debugStore.isDebugMode"
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
          />
        </div>

        <div v-if="debugStore.isDebugMode" class="bg-base-200 mt-3 rounded p-2">
          <div class="text-base-content/70 text-xs">
            Network simulation controls available in status bar
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="btn btn-outline"
          :disabled="isLoading"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="isLoading"
          @click="handleSave"
        >
          <template v-if="isLoading">
            <span class="loading loading-spinner loading-sm"></span>
            Testing...
          </template>
          <template v-else-if="showSuccess">
            <CheckCircleIcon class="size-4" />
            Saved!
          </template>
          <template v-else> Test & Save </template>
        </button>
      </div>
    </template>
  </BaseModal>

  <Teleport to="body">
    <div
      v-if="showTooltip"
      class="endpoint-tooltip fixed z-[9999] max-w-sm"
      :style="{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
      }"
      @click.stop
    >
      <div class="bg-base-100 border-base-300 rounded-lg border p-4 shadow-xl">
        <div class="text-base-content mb-3 text-sm font-medium">
          Supported endpoint formats:
        </div>

        <div class="space-y-2 text-xs">
          <div class="bg-base-200/50 rounded p-2">
            <code class="text-primary font-mono">/api/webrpc/v0</code>
            <div class="text-base-content/60 mt-1">
              <strong>Relative path</strong> - Recommended for local development
            </div>
          </div>

          <div class="bg-base-200/50 rounded p-2">
            <code class="text-primary font-mono break-all"
              >ws://host:4701/api/webrpc/v0</code
            >
            <div class="text-base-content/60 mt-1">
              <strong>WebSocket URL</strong> - Direct connection to Curio server
            </div>
          </div>

          <div class="bg-base-200/50 rounded p-2">
            <code class="text-primary font-mono break-all"
              >http://host:4701/api/webrpc/v0</code
            >
            <div class="text-base-content/60 mt-1">
              <strong>HTTP URL</strong> - Auto-converted to WebSocket
            </div>
          </div>
        </div>

        <div class="border-base-300/50 mt-3 border-t pt-2">
          <div class="text-base-content/70 text-xs">
            Replace
            <code class="text-primary bg-base-200 rounded px-1">host:4701</code>
            with your server address
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.endpoint-tooltip {
  transform: translateY(-100%);
}

.endpoint-tooltip code {
  font-size: 0.75rem;
}
</style>
