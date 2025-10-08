<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "@tanstack/vue-form";
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
const submissionError = ref<string | null>(null);
const showSuccess = ref(false);
const showTooltip = ref(false);
const tooltipPosition = ref({ x: 0, y: 0 });
const isDev = import.meta.env.DEV;
const defaultEndpoint =
  import.meta.env.VITE_CURIO_ENDPOINT || "ws://localhost:4701/api/webrpc/v0";

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

const settingsForm = useForm({
  defaultValues: {
    endpoint: configStore.getEndpoint(),
  },
  onSubmit: async ({ value }) => {
    submissionError.value = null;

    const isConnectionValid = await testConnection(value.endpoint);

    if (isConnectionValid) {
      const normalizedEndpoint = normalizeEndpoint(value.endpoint);
      configStore.setEndpoint(normalizedEndpoint);
      showSuccess.value = true;
    } else {
      submissionError.value =
        "Cannot connect to Curio server. Please verify the endpoint and server status.";
      throw new Error(submissionError.value);
    }
  },
});

const isSubmitting = settingsForm.useStore((state) => state.isSubmitting);
const canSubmit = settingsForm.useStore((state) => state.canSubmit);

const endpointValidators = {
  onChange: ({ value }: { value: string }) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Please enter a Curio API endpoint";
    }
    if (!validateEndpoint(trimmed)) {
      return "Invalid endpoint format. Use /path, ws://, wss://, http://, or https://";
    }
    return undefined;
  },
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      settingsForm.reset({ endpoint: configStore.getEndpoint() });
      submissionError.value = null;
      showSuccess.value = false;
    } else {
      showSuccess.value = false;
    }
  },
);

const handleSave = async () => {
  await settingsForm.handleSubmit();
};

const handleClose = () => {
  emit("update:open", false);
};

const resetToDefault = () => {
  settingsForm.setFieldValue("endpoint", defaultEndpoint);
  submissionError.value = null;
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

        <component
          :is="settingsForm.Field"
          name="endpoint"
          :validators="endpointValidators"
        >
          <template #default="{ field }">
            <div class="relative">
              <input
                type="text"
                placeholder="/api/webrpc/v0"
                class="input input-bordered w-full"
                :value="field.state.value"
                :class="{
                  'input-error':
                    field.state.meta.errors.length > 0 &&
                    field.state.meta.isTouched,
                  'input-success': showSuccess,
                }"
                :disabled="isSubmitting"
                @input="
                  (e) =>
                    field.handleChange((e.target as HTMLInputElement).value)
                "
                @blur="field.handleBlur"
                @keyup.enter="handleSave"
              />
              <div
                v-if="showSuccess"
                class="absolute top-1/2 right-3 -translate-y-1/2"
              >
                <CheckCircleIcon class="text-success size-4" />
              </div>
            </div>
            <p
              v-if="
                field.state.meta.errors.length > 0 && field.state.meta.isTouched
              "
              class="text-error mt-1 text-sm"
            >
              {{ field.state.meta.errors[0] }}
            </p>
          </template>
        </component>

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
              :disabled="isSubmitting"
              @click="resetToDefault"
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>

      <div v-if="submissionError" class="alert alert-error py-2">
        <ExclamationTriangleIcon class="size-4" />
        <div class="text-sm">{{ submissionError }}</div>
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
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="isSubmitting || !canSubmit"
          @click="handleSave"
        >
          <template v-if="isSubmitting">
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
