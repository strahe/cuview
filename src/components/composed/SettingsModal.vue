<script setup lang="ts">
import { ref, watch } from "vue";
import { useConfigStore } from "@/stores/config";
import { useDebugStore } from "@/stores/debug";
import {
  XMarkIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";

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
const isDev = import.meta.env.DEV;

// Watch for modal open/close to reset form
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      endpointInput.value = configStore.getEndpoint();
      error.value = "";
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
  } catch (err) {
    console.error("Connection test failed:", err);
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

      // Close modal after showing success
      setTimeout(() => {
        emit("update:open", false);
        showSuccess.value = false;
      }, 1500);
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

const handleCancel = () => {
  emit("update:open", false);
};

const defaultEndpoint = import.meta.env.VITE_CURIO_ENDPOINT || "/api/webrpc/v0";

const resetToDefault = () => {
  endpointInput.value = defaultEndpoint;
  error.value = "";
};
</script>

<template>
  <div v-if="open" class="modal modal-open">
    <div class="modal-box max-h-[85vh] max-w-3xl overflow-y-auto">
      <!-- Header -->
      <div class="bg-base-100 sticky top-0 z-10 mb-6 pb-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-5">
            <div
              class="from-primary to-primary/80 text-primary-content flex size-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-md"
            >
              <Cog6ToothIcon class="size-6" />
            </div>
            <div>
              <h3 class="text-base-content text-xl font-bold">Settings</h3>
              <p class="text-base-content/60 mt-1 text-sm">
                Configure your Curio dashboard preferences
              </p>
            </div>
          </div>
          <button
            class="btn btn-ghost btn-circle btn-lg hover:bg-base-200"
            title="Close settings"
            @click="handleCancel"
          >
            <XMarkIcon class="size-6" />
          </button>
        </div>
        <div class="divider mt-4 mb-0"></div>
      </div>

      <!-- Settings Sections -->
      <div class="space-y-8">
        <!-- API Configuration Section -->
        <div
          class="from-base-100 to-base-50 border-base-300/50 rounded-2xl border bg-gradient-to-br shadow-sm transition-shadow duration-200 hover:shadow-md"
        >
          <div class="p-6">
            <div class="mb-6 flex items-start gap-4">
              <div
                class="from-info to-info/80 text-info-content flex size-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-md"
              >
                <svg
                  class="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div class="flex-1">
                <h4 class="text-base-content mb-2 text-xl font-bold">
                  API Connection
                </h4>
                <p class="text-base-content/60 text-base leading-relaxed">
                  Configure your Curio API endpoint to connect to your cluster
                </p>
              </div>
            </div>

            <div class="space-y-5">
              <div class="form-control">
                <label class="label pb-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="label-text text-base-content text-base font-semibold"
                    >
                      Endpoint URL
                    </span>
                    <div class="dropdown dropdown-top dropdown-hover">
                      <div
                        tabindex="0"
                        role="button"
                        class="btn btn-ghost btn-xs p-1"
                      >
                        <svg
                          class="text-base-content/50 hover:text-info size-4 cursor-help"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div
                        class="dropdown-content card card-compact bg-base-100 border-base-300/50 z-[1] w-64 border p-0 shadow-lg"
                      >
                        <div class="card-body text-sm">
                          <div class="space-y-2">
                            <div>
                              <code class="text-primary font-mono text-xs"
                                >/api/webrpc/v0</code
                              >
                              <p class="text-base-content/60 text-xs">
                                Relative path (recommended)
                              </p>
                            </div>
                            <div>
                              <code
                                class="text-primary font-mono text-xs break-all"
                                >ws://host:4701/api/webrpc/v0</code
                              >
                              <p class="text-base-content/60 text-xs">
                                WebSocket URL
                              </p>
                            </div>
                            <div>
                              <code
                                class="text-primary font-mono text-xs break-all"
                                >http://host:4701/api/webrpc/v0</code
                              >
                              <p class="text-base-content/60 text-xs">
                                Auto-converted to WebSocket
                              </p>
                            </div>
                          </div>
                          <div class="divider my-2"></div>
                          <div class="flex items-start gap-2">
                            <svg
                              class="text-warning mt-0.5 size-3 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                            <p class="text-warning/80 text-xs leading-tight">
                              <strong>Security:</strong><br />
                              No authentication required.<br />
                              Use only on trusted networks.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span class="badge badge-error badge-sm font-medium"
                    >Required</span
                  >
                </label>
                <div class="relative">
                  <input
                    v-model="endpointInput"
                    type="text"
                    placeholder="e.g., /api/webrpc/v0 or ws://localhost:4701/api/webrpc/v0"
                    class="input input-bordered input-lg bg-base-100 focus:bg-base-50 w-full text-base transition-colors duration-200"
                    :class="{
                      'input-error border-error focus:border-error': error,
                      'input-success border-success focus:border-success':
                        showSuccess,
                    }"
                    :disabled="isLoading || showSuccess"
                    @keyup.enter="handleSave"
                  />
                  <div
                    v-if="showSuccess"
                    class="absolute top-1/2 right-4 -translate-y-1/2 transform"
                  >
                    <CheckCircleIcon class="text-success size-5" />
                  </div>
                </div>
                <div class="label pt-3">
                  <span class="label-text-alt text-base-content/50 text-sm">
                    WebSocket endpoint for your Curio API server
                  </span>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm normal-case"
                    :disabled="isLoading || showSuccess"
                    @click="resetToDefault"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>

              <!-- Status Messages -->
              <div v-if="error" class="alert alert-error shadow-md">
                <ExclamationTriangleIcon class="size-5 flex-shrink-0" />
                <div class="flex-1">
                  <div class="font-medium">Connection Error</div>
                  <div class="mt-1 text-sm">{{ error }}</div>
                </div>
              </div>

              <div v-if="showSuccess" class="alert alert-success shadow-md">
                <CheckCircleIcon class="size-5 flex-shrink-0" />
                <div class="flex-1">
                  <div class="font-medium">Success!</div>
                  <div class="mt-1 text-sm">
                    Configuration saved successfully!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Debug Settings (Development Only) -->
        <div
          v-if="isDev"
          class="from-warning/5 to-warning/10 border-warning/20 rounded-2xl border bg-gradient-to-br shadow-sm transition-shadow duration-200 hover:shadow-md"
        >
          <div class="p-6">
            <div class="mb-6 flex items-start gap-4">
              <div
                class="from-warning to-warning/80 text-warning-content flex size-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-md"
              >
                <svg
                  class="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div class="flex-1">
                <div class="mb-2 flex items-center gap-3">
                  <h4 class="text-base-content text-xl font-bold">
                    Developer Options
                  </h4>
                  <div class="badge badge-warning badge-lg font-semibold">
                    DEV MODE
                  </div>
                </div>
                <p class="text-base-content/60 text-base leading-relaxed">
                  Development and testing tools for network simulation
                </p>
              </div>
            </div>

            <div class="space-y-5">
              <!-- Debug Mode Toggle -->
              <div
                class="bg-base-50 border-base-300/50 hover:bg-base-100 rounded-xl border p-5 transition-colors duration-200"
              >
                <div class="flex items-start justify-between gap-5">
                  <div class="flex-1">
                    <h5 class="text-base-content mb-2 text-lg font-bold">
                      Network Debug Mode
                    </h5>
                    <p class="text-base-content/60 text-base leading-relaxed">
                      Simulate network conditions to test error handling and
                      loading states without affecting your actual connection
                    </p>
                  </div>
                  <div class="flex-shrink-0">
                    <input
                      v-model="debugStore.isDebugMode"
                      type="checkbox"
                      class="toggle toggle-primary toggle-lg"
                    />
                  </div>
                </div>

                <!-- Network Simulation Options -->
                <div v-if="debugStore.isDebugMode" class="mt-6 space-y-4">
                  <div
                    class="from-info/10 to-info/5 border-info/20 rounded-xl border bg-gradient-to-r p-4"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="bg-info/20 flex size-8 items-center justify-center rounded-lg"
                      >
                        <svg
                          class="text-info size-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clip-rule="evenodd"
                          ></path>
                        </svg>
                      </div>
                      <div class="flex-1">
                        <p class="text-info text-base font-medium">
                          Network simulation controls available in status bar
                          when debug mode is enabled
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div
        class="bg-base-100 border-base-300/50 sticky bottom-0 mt-8 border-t pt-5"
      >
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="btn btn-outline btn-lg px-8 font-medium normal-case"
            :disabled="isLoading || showSuccess"
            @click="handleCancel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary btn-lg px-8 font-medium normal-case shadow-md transition-shadow duration-200 hover:shadow-lg"
            :disabled="isLoading || showSuccess"
            @click="handleSave"
          >
            <!-- Loading state -->
            <template v-if="isLoading">
              <span class="loading loading-spinner loading-sm"></span>
              <span class="ml-2">Testing Connection...</span>
            </template>
            <!-- Success state -->
            <template v-else-if="showSuccess">
              <CheckCircleIcon class="size-5" />
              <span class="ml-2">Connected & Saved!</span>
            </template>
            <!-- Default state -->
            <template v-else>
              <svg
                class="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span class="ml-2">Test & Save</span>
            </template>
          </button>
        </div>
      </div>
    </div>
    <div class="modal-backdrop" @click="handleCancel"></div>
  </div>
</template>
