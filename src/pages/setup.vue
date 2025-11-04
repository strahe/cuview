<!-- eslint-disable vue/multi-word-component-names -->
<route>
{
  "meta": {
    "title": "Setup"
  }
}
</route>

<script setup lang="ts">
import { onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useEndpointSettingsForm } from "@/composables/useEndpointSettingsForm";
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();

let redirectTimer: number | null = null;

const scheduleRedirect = () => {
  if (redirectTimer) {
    clearTimeout(redirectTimer);
  }
  redirectTimer = window.setTimeout(() => {
    router.replace("/overview");
  }, 2000);
};

const {
  form: endpointForm,
  isSubmitting,
  canSubmit,
  submissionError,
  isSuccessful,
  endpointValidators,
} = useEndpointSettingsForm({
  timeout: 4000,
  onSuccess: scheduleRedirect,
});

onBeforeUnmount(() => {
  if (redirectTimer) {
    clearTimeout(redirectTimer);
  }
});
</script>

<template>
  <div
    class="bg-base-300 flex min-h-screen items-center justify-center px-4 py-10"
  >
    <div class="w-full max-w-5xl">
      <div
        class="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
      >
        <section
          class="bg-base-100 border-base-300 rounded-2xl border p-6 shadow-xl lg:p-8"
        >
          <header
            class="flex flex-col gap-6 text-center lg:flex-row lg:items-center lg:gap-8 lg:text-left"
          >
            <div
              class="bg-primary text-primary-content mx-auto inline-flex size-16 items-center justify-center rounded-xl shadow-lg lg:mx-0 lg:size-20"
            >
              <Cog6ToothIcon class="size-9 lg:size-10" />
            </div>
            <div class="space-y-2">
              <h1 class="text-3xl font-bold lg:text-4xl">Setup Cuview</h1>
              <p class="text-base-content/70 text-base lg:max-w-md">
                Configure your Curio API endpoint to get started with cluster
                management
              </p>
            </div>
          </header>

          <form
            class="mt-8 space-y-6"
            @submit.prevent="endpointForm.handleSubmit"
          >
            <div class="border-base-300 border-b pb-4">
              <h2 class="mb-2 text-xl font-semibold">API Configuration</h2>
              <p class="text-base-content/70 text-sm">
                Enter your Curio API server address below
              </p>
            </div>

            <div class="form-control space-y-2">
              <label class="label justify-start gap-2">
                <span class="label-text text-base font-medium"
                  >Curio API Server</span
                >
                <span class="badge badge-primary badge-xs">Required</span>
              </label>

              <component
                :is="endpointForm.Field"
                name="endpoint"
                :validators="endpointValidators"
              >
                <template #default="{ field }">
                  <input
                    type="text"
                    placeholder="e.g., http://localhost:4701"
                    class="input input-bordered input-lg w-full text-base"
                    :value="field.state.value"
                    :class="{
                      'input-error':
                        field.state.meta.errors.length > 0 &&
                        field.state.meta.isTouched,
                      'input-success': isSuccessful,
                    }"
                    :disabled="isSuccessful"
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
                Supports URLs starting with
                <code class="font-mono text-xs">http://</code>,
                <code class="font-mono text-xs">https://</code>,
                <code class="font-mono text-xs">ws://</code>, or
                <code class="font-mono text-xs">wss://</code>.
              </p>

              <div v-if="submissionError" class="alert alert-error mt-3">
                <ExclamationTriangleIcon class="size-5" />
                <span>{{ submissionError }}</span>
              </div>

              <div v-if="isSuccessful" class="alert alert-success mt-3">
                <CheckCircleIcon class="size-5" />
                <span>Configuration saved successfully! Redirecting...</span>
              </div>
            </div>

            <div class="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                class="btn btn-primary btn-lg flex-1"
                :disabled="isSubmitting || isSuccessful || !canSubmit"
              >
                <template v-if="isSubmitting">
                  <span class="loading loading-spinner loading-sm"></span>
                  Testing Connection...
                </template>
                <template v-else-if="isSuccessful">
                  <CheckCircleIcon class="size-5" />
                  Saved! Redirecting...
                </template>
                <template v-else> Test Connection & Save </template>
              </button>
            </div>
          </form>
        </section>

        <aside class="space-y-6">
          <div
            class="bg-base-100 border-base-300 rounded-2xl border p-6 shadow-lg"
          >
            <h3 class="mb-3 flex items-center gap-2 font-semibold">
              <div
                class="bg-info/20 text-info flex size-6 items-center justify-center rounded-full text-xs font-bold"
              >
                i
              </div>
              Endpoint Examples
            </h3>
            <div class="space-y-3">
              <div class="bg-base-200 border-base-300 rounded-lg border p-3">
                <code class="font-mono text-sm"
                  >http://your-curio-gui-server:4701</code
                >
                <p class="text-base-content/60 mt-1 text-xs">
                  HTTP address example. Replace with your actual host or IP.
                </p>
              </div>
              <div class="bg-base-200 border-base-300 rounded-lg border p-3">
                <code class="font-mono text-sm"
                  >ws://your-curio-gui-server:4701</code
                >
                <p class="text-base-content/60 mt-1 text-xs">
                  WebSocket address example. Replace with your actual host or
                  IP.
                </p>
              </div>
            </div>
          </div>

          <div
            class="bg-warning/5 border-warning/20 text-warning-content rounded-2xl border p-6 shadow-lg"
          >
            <h3 class="mb-3 flex items-center gap-2 font-semibold">
              <div
                class="bg-warning text-warning-content flex size-6 items-center justify-center rounded-full text-xs font-bold"
              >
                !
              </div>
              Security Notice
            </h3>
            <div class="text-base-content/80 space-y-2 text-sm">
              <p>
                Curio currently runs <strong>without authentication</strong>.
              </p>
              <ul class="list-inside list-disc space-y-1 text-xs">
                <li>Only connect to trusted local networks</li>
                <li>Use secure tunneling (SSH, VPN) for remote access</li>
                <li>
                  <strong>Never expose Curio directly to the internet</strong>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
