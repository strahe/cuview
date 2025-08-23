<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useConfigStore } from "@/stores/config";
import { Cog6ToothIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/vue/24/outline";

const router = useRouter();
const configStore = useConfigStore();
const endpointInput = ref("");
const isLoading = ref(false);
const error = ref("");
const isValid = ref(false);

onMounted(() => {
  endpointInput.value = configStore.getEndpoint();
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
      timeout: 10000
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

const handleSubmit = async () => {
  if (!endpointInput.value.trim()) {
    error.value = "Please enter a Curio API endpoint";
    return;
  }

  error.value = "";
  isValid.value = false;
  isLoading.value = true;

  try {
    const isConnectionValid = await testConnection(endpointInput.value);
    
    if (isConnectionValid) {
      const normalizedEndpoint = normalizeEndpoint(endpointInput.value);
      configStore.setEndpoint(normalizedEndpoint);
      isLoading.value = false;
      isValid.value = true;
      
      setTimeout(() => {
        router.replace("/overview");
      }, 2000);
    } else {
      isLoading.value = false;
      error.value = "Cannot connect to Curio server. Please verify the endpoint is correct and the server is running.";
    }
  } catch (err) {
    console.error("Connection test error:", err);
    isLoading.value = false;
    error.value = "Connection test failed. Please check your network connection and try again.";
  }
};

const hasEnvEndpoint = import.meta.env.VITE_CURIO_ENDPOINT;

const skipToOverview = () => {
  // Use default endpoint
  configStore.setEndpoint(hasEnvEndpoint || "/api/webrpc/v0");
  router.replace("/overview");
};
</script>

<template>
  <div class="bg-base-200 flex min-h-screen items-center justify-center px-4 py-8">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-10">
        <div class="bg-primary text-primary-content inline-flex size-20 items-center justify-center rounded-full mb-6 shadow-lg">
          <Cog6ToothIcon class="size-10" />
        </div>
        <h1 class="text-4xl font-bold mb-3">Setup Cuview</h1>
        <p class="text-base-content/70 text-lg max-w-md mx-auto">
          Configure your Curio API endpoint to get started with cluster management
        </p>
      </div>

      <!-- Configuration Card -->
      <div class="bg-base-100 rounded-xl p-8 shadow-xl border border-base-300/50">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Form Header -->
          <div class="border-b border-base-300/50 pb-4">
            <h2 class="text-xl font-semibold mb-2">API Configuration</h2>
            <p class="text-base-content/70 text-sm">Enter your Curio WebSocket API endpoint below</p>
          </div>

          <!-- Input Section -->
          <div class="form-control space-y-2">
            <label class="label justify-start gap-2">
              <span class="label-text font-medium text-base">Curio API Endpoint</span>
              <span class="badge badge-primary badge-xs">Required</span>
            </label>
            <input
              v-model="endpointInput"
              type="text"
              placeholder="e.g., /api/webrpc/v0 or ws://localhost:4701/api/webrpc/v0"
              class="input input-bordered input-lg w-full text-base"
              :class="{ 'input-error': error, 'input-success': isValid }"
              :disabled="isLoading || isValid"
            />
            <p class="text-sm text-base-content/60 mt-1">
              WebSocket endpoint for your Curio API server
            </p>
            
            <!-- Status Messages -->
            <div v-if="error" class="alert alert-error mt-3">
              <ExclamationTriangleIcon class="size-5" />
              <span>{{ error }}</span>
            </div>
            
            <div v-if="isValid" class="alert alert-success mt-3">
              <CheckCircleIcon class="size-5" />
              <span>Connected successfully! Redirecting to dashboard...</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              class="btn btn-primary btn-lg flex-1"
              :disabled="isLoading || isValid"
            >
              <template v-if="isLoading">
                <span class="loading loading-spinner loading-sm"></span>
                Testing Connection...
              </template>
              <template v-else-if="isValid">
                <CheckCircleIcon class="size-5" />
                Connected Successfully!
              </template>
              <template v-else>
                Test Connection & Continue
              </template>
            </button>

            <button
              v-if="hasEnvEndpoint"
              type="button"
              class="btn btn-outline"
              :disabled="isLoading || isValid"
              @click="skipToOverview"
            >
              Use Default Endpoint
            </button>
          </div>
        </form>
      </div>

      <!-- Help & Security Section -->
      <div class="grid md:grid-cols-2 gap-6 mt-8">
        <!-- Examples -->
        <div class="bg-base-100 rounded-xl p-6 border border-base-300/50">
          <h3 class="font-semibold mb-3 flex items-center gap-2">
            <div class="bg-info/20 text-info flex size-6 items-center justify-center rounded-full text-xs font-bold">
              i
            </div>
            Endpoint Examples
          </h3>
          <div class="space-y-3">
            <div class="bg-base-200 rounded-lg p-3">
              <code class="text-sm font-mono">/api/webrpc/v0</code>
              <p class="text-xs text-base-content/60 mt-1">Relative path (same origin)</p>
            </div>
            <div class="bg-base-200 rounded-lg p-3">
              <code class="text-sm font-mono">ws://localhost:4701/api/webrpc/v0</code>
              <p class="text-xs text-base-content/60 mt-1">WebSocket URL (recommended)</p>
            </div>
            <div class="bg-base-200 rounded-lg p-3">
              <code class="text-sm font-mono">http://localhost:4701/api/webrpc/v0</code>
              <p class="text-xs text-base-content/60 mt-1">HTTP URL (auto-converted to WebSocket)</p>
            </div>
          </div>
        </div>

        <!-- Security Warning -->
        <div class="bg-warning/5 border border-warning/20 rounded-xl p-6">
          <h3 class="font-semibold mb-3 flex items-center gap-2 text-warning-content">
            <div class="bg-warning text-warning-content flex size-6 items-center justify-center rounded-full text-xs font-bold">
              !
            </div>
            Security Notice
          </h3>
          <div class="space-y-2 text-sm text-base-content/80">
            <p>Curio currently runs <strong>without authentication</strong>.</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
              <li>Only connect to trusted local networks</li>
              <li>Use secure tunneling (SSH, VPN) for remote access</li>
              <li><strong>Never expose Curio directly to the internet</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>