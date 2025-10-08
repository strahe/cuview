<!-- eslint-disable vue/multi-word-component-names -->
<route>
{
  "meta": {
    "title": "Setup"
  }
}
</route>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useForm } from "@tanstack/vue-form";
import { useConfigStore } from "@/stores/config";
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const configStore = useConfigStore();

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
    return await testEndpointConnection(normalizedEndpoint, 10000);
  } catch (err) {
    console.error("Connection test failed:", err);
    return false;
  }
};

const connectionSuccess = ref(false);
const submissionError = ref<string | null>(null);

const setupForm = useForm({
  defaultValues: {
    endpoint: configStore.getEndpoint(),
  },
  onSubmit: async ({ value }) => {
    submissionError.value = null;

    const normalizedEndpoint = normalizeEndpoint(value.endpoint);
    const isConnectionValid = await testConnection(normalizedEndpoint);

    if (isConnectionValid) {
      configStore.setEndpoint(normalizedEndpoint);
      connectionSuccess.value = true;

      setTimeout(() => {
        router.replace("/overview");
      }, 2000);
    } else {
      submissionError.value =
        "Cannot connect to Curio server. Please verify the endpoint is correct and the server is running.";
      throw new Error(submissionError.value);
    }
  },
});

const isSubmitting = setupForm.useStore((state) => state.isSubmitting);
const canSubmit = setupForm.useStore((state) => state.canSubmit);

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

const hasEnvEndpoint = import.meta.env.VITE_CURIO_ENDPOINT;

const skipToOverview = () => {
  // Use default endpoint
  configStore.setEndpoint(
    hasEnvEndpoint || "ws://localhost:4701/api/webrpc/v0",
  );
  router.replace("/overview");
};
</script>

<template>
  <div
    class="bg-base-200 flex min-h-screen items-center justify-center px-4 py-8"
  >
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="mb-10 text-center">
        <div
          class="bg-primary text-primary-content mb-6 inline-flex size-20 items-center justify-center rounded-full shadow-lg"
        >
          <Cog6ToothIcon class="size-10" />
        </div>
        <h1 class="mb-3 text-4xl font-bold">Setup Cuview</h1>
        <p class="text-base-content/70 mx-auto max-w-md text-lg">
          Configure your Curio API endpoint to get started with cluster
          management
        </p>
      </div>

      <!-- Configuration Card -->
      <div
        class="bg-base-100 border-base-300/50 rounded-xl border p-8 shadow-xl"
      >
        <form class="space-y-6" @submit.prevent="setupForm.handleSubmit">
          <!-- Form Header -->
          <div class="border-base-300/50 border-b pb-4">
            <h2 class="mb-2 text-xl font-semibold">API Configuration</h2>
            <p class="text-base-content/70 text-sm">
              Enter your Curio WebSocket API endpoint below
            </p>
          </div>

          <!-- Input Section -->
          <div class="form-control space-y-2">
            <label class="label justify-start gap-2">
              <span class="label-text text-base font-medium"
                >Curio API Endpoint</span
              >
              <span class="badge badge-primary badge-xs">Required</span>
            </label>

            <component
              :is="setupForm.Field"
              name="endpoint"
              :validators="endpointValidators"
            >
              <template #default="{ field }">
                <input
                  type="text"
                  placeholder="e.g., /api/webrpc/v0 or ws://localhost:4701/api/webrpc/v0"
                  class="input input-bordered input-lg w-full text-base"
                  :value="field.state.value"
                  :class="{
                    'input-error':
                      field.state.meta.errors.length > 0 &&
                      field.state.meta.isTouched,
                    'input-success': connectionSuccess,
                  }"
                  :disabled="isSubmitting || connectionSuccess"
                  @input="
                    (e) =>
                      field.handleChange((e.target as HTMLInputElement).value)
                  "
                  @blur="field.handleBlur"
                />
                <p
                  v-if="
                    field.state.meta.errors.length > 0 &&
                    field.state.meta.isTouched
                  "
                  class="text-error mt-1 text-sm"
                >
                  {{ field.state.meta.errors[0] }}
                </p>
              </template>
            </component>

            <p class="text-base-content/60 mt-1 text-sm">
              WebSocket endpoint for your Curio API server
            </p>

            <!-- Status Messages -->
            <div v-if="submissionError" class="alert alert-error mt-3">
              <ExclamationTriangleIcon class="size-5" />
              <span>{{ submissionError }}</span>
            </div>

            <div v-if="connectionSuccess" class="alert alert-success mt-3">
              <CheckCircleIcon class="size-5" />
              <span>Connected successfully! Redirecting to dashboard...</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              class="btn btn-primary btn-lg flex-1"
              :disabled="isSubmitting || connectionSuccess || !canSubmit"
            >
              <template v-if="isSubmitting">
                <span class="loading loading-spinner loading-sm"></span>
                Testing Connection...
              </template>
              <template v-else-if="connectionSuccess">
                <CheckCircleIcon class="size-5" />
                Connected Successfully!
              </template>
              <template v-else> Test Connection & Continue </template>
            </button>

            <button
              v-if="hasEnvEndpoint"
              type="button"
              class="btn btn-outline"
              :disabled="isSubmitting || connectionSuccess"
              @click="skipToOverview"
            >
              Use Default Endpoint
            </button>
          </div>
        </form>
      </div>

      <!-- Help & Security Section -->
      <div class="mt-8 grid gap-6 md:grid-cols-2">
        <!-- Examples -->
        <div class="bg-base-100 border-base-300/50 rounded-xl border p-6">
          <h3 class="mb-3 flex items-center gap-2 font-semibold">
            <div
              class="bg-info/20 text-info flex size-6 items-center justify-center rounded-full text-xs font-bold"
            >
              i
            </div>
            Endpoint Examples
          </h3>
          <div class="space-y-3">
            <div class="bg-base-200 rounded-lg p-3">
              <code class="font-mono text-sm">/api/webrpc/v0</code>
              <p class="text-base-content/60 mt-1 text-xs">
                Relative path (same origin)
              </p>
            </div>
            <div class="bg-base-200 rounded-lg p-3">
              <code class="font-mono text-sm"
                >ws://localhost:4701/api/webrpc/v0</code
              >
              <p class="text-base-content/60 mt-1 text-xs">
                WebSocket URL (recommended)
              </p>
            </div>
            <div class="bg-base-200 rounded-lg p-3">
              <code class="font-mono text-sm"
                >http://localhost:4701/api/webrpc/v0</code
              >
              <p class="text-base-content/60 mt-1 text-xs">
                HTTP URL (auto-converted to WebSocket)
              </p>
            </div>
          </div>
        </div>

        <!-- Security Warning -->
        <div class="bg-warning/5 border-warning/20 rounded-xl border p-6">
          <h3
            class="text-warning-content mb-3 flex items-center gap-2 font-semibold"
          >
            <div
              class="bg-warning text-warning-content flex size-6 items-center justify-center rounded-full text-xs font-bold"
            >
              !
            </div>
            Security Notice
          </h3>
          <div class="text-base-content/80 space-y-2 text-sm">
            <p>Curio currently runs <strong>without authentication</strong>.</p>
            <ul class="list-inside list-disc space-y-1 text-xs">
              <li>Only connect to trusted local networks</li>
              <li>Use secure tunneling (SSH, VPN) for remote access</li>
              <li>
                <strong>Never expose Curio directly to the internet</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
