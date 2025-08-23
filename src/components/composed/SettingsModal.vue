<script setup lang="ts">
import { ref, watch } from "vue";
import { useConfigStore } from "@/stores/config";
import { 
  XMarkIcon, 
  Cog6ToothIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
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
const endpointInput = ref("");
const isLoading = ref(false);
const error = ref("");
const showSuccess = ref(false);

// Watch for modal open/close to reset form
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    endpointInput.value = configStore.getEndpoint();
    error.value = "";
    showSuccess.value = false;
  }
});

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
    const { CurioApiService } = await import("@/services/curio-api");
    const testApi = new CurioApiService({ 
      endpoint: normalizedEndpoint,
      timeout: 8000
    });

    await testApi.connect();
    await testApi.call("Version");
    testApi.disconnect();
    return true;
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
      error.value = "Cannot connect to Curio server. Please verify the endpoint and server status.";
    }
  } catch {
    error.value = "Connection test failed. Please check your network connection.";
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
    <div class="modal-box max-w-lg">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="bg-primary text-primary-content flex size-10 items-center justify-center rounded-lg">
            <Cog6ToothIcon class="size-5" />
          </div>
          <h3 class="text-lg font-semibold">Curio API Settings</h3>
        </div>
        <button
          class="btn btn-ghost btn-sm btn-square"
          @click="handleCancel"
        >
          <XMarkIcon class="size-5" />
        </button>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">API Endpoint</span>
            <span class="label-text-alt">Required</span>
          </label>
          <input
            v-model="endpointInput"
            type="text"
            placeholder="e.g., /api/webrpc/v0 or ws://localhost:4701/api/webrpc/v0"
            class="input input-bordered w-full"
            :class="{ 'input-error': error, 'input-success': showSuccess }"
            :disabled="isLoading || showSuccess"
          />
          <label class="label">
            <span class="label-text-alt text-base-content/60">
              WebSocket endpoint for your Curio API
            </span>
            <button
              type="button"
              class="label-text-alt link link-primary"
              :disabled="isLoading || showSuccess"
              @click="resetToDefault"
            >
              Reset to Default
            </button>
          </label>

          <div v-if="error" class="text-error text-sm mt-2 flex items-center gap-2">
            <ExclamationTriangleIcon class="size-4" />
            {{ error }}
          </div>
          
          <div v-if="showSuccess" class="text-success text-sm mt-2 flex items-center gap-2">
            <CheckCircleIcon class="size-4" />
            Configuration saved successfully!
          </div>
        </div>

        <!-- Help Section -->
        <div class="bg-base-200 rounded-lg p-3">
          <h4 class="text-sm font-medium mb-2">Endpoint Examples:</h4>
          <ul class="text-xs text-base-content/70 space-y-1">
            <li><code>/api/webrpc/v0</code> - Relative path</li>
            <li><code>ws://localhost:4701/api/webrpc/v0</code> - WebSocket URL</li>
            <li><code>http://localhost:4701/api/webrpc/v0</code> - HTTP (auto-converted)</li>
          </ul>
          
          <!-- Security Warning -->
          <div class="bg-warning/10 border border-warning/20 rounded-lg p-2 mt-2">
            <div class="flex items-center gap-2">
              <div class="bg-warning text-warning-content flex size-4 items-center justify-center rounded-full text-xs font-bold">
                !
              </div>
              <p class="text-xs text-base-content/80">
                <strong>Security:</strong> Curio runs without authentication. Use only on trusted networks.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="isLoading || showSuccess"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="isLoading || showSuccess"
          @click="handleSave"
        >
          <!-- Loading state -->
          <template v-if="isLoading">
            <span class="loading loading-spinner loading-sm"></span>
            Testing Connection...
          </template>
          <!-- Success state -->
          <template v-else-if="showSuccess">
            <CheckCircleIcon class="size-4" />
            Connected & Saved!
          </template>
          <!-- Default state -->
          <template v-else>
            Test & Save
          </template>
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="handleCancel"></div>
  </div>
</template>