<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  PlusIcon,
  TrashIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from "@heroicons/vue/24/outline";

import SectionCard from "@/components/ui/SectionCard.vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useLazyQuery } from "@/composables/useLazyQuery";
import type { PdpService, PdpServicePayload } from "../types";

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

const {
  data: services,
  loading,
  error,
  refresh,
} = useCachedQuery<PdpService[]>("PDPServices", [], {
  pollingInterval: 30000,
});

const addService = useLazyQuery<void>("AddPDPService");
const removeService = useLazyQuery<void>("RemovePDPService");

const status = ref<StatusMessage | null>(null);

const showAddModal = ref(false);
const serviceForm = reactive({
  name: "",
  publicKey: "",
});
const localFormError = ref("");
const removingServiceId = ref<number | null>(null);

const resetForm = () => {
  serviceForm.name = "";
  serviceForm.publicKey = "";
  localFormError.value = "";
};

const handleOpenModal = () => {
  resetForm();
  showAddModal.value = true;
};

const setStatus = (payload: StatusMessage | null) => {
  status.value = payload;
  if (payload) {
    window.setTimeout(() => {
      if (status.value === payload) {
        status.value = null;
      }
    }, 4000);
  }
};

const handleSubmit = async () => {
  const payload: PdpServicePayload = {
    name: serviceForm.name.trim(),
    publicKey: serviceForm.publicKey.trim(),
  };

  if (!payload.name || !payload.publicKey) {
    localFormError.value = "Both name and public key are required.";
    return;
  }

  localFormError.value = "";

  try {
    await addService.execute(payload.name, payload.publicKey);
    setStatus({ type: "success", text: `Service "${payload.name}" added.` });
    showAddModal.value = false;
    resetForm();
    await refresh();
  } catch (err) {
    localFormError.value =
      err instanceof Error ? err.message : "Failed to add service.";
  }
};

const serviceToRemove = ref<PdpService | null>(null);
const showRemoveDialog = ref(false);

const removeDialogMessage = computed(() =>
  serviceToRemove.value
    ? `Remove service "${serviceToRemove.value.name}"? This action cannot be undone.`
    : "",
);

const removeDialogLoading = computed(
  () =>
    !!serviceToRemove.value &&
    removingServiceId.value !== null &&
    removingServiceId.value === serviceToRemove.value.id,
);

const requestRemove = (service: PdpService) => {
  serviceToRemove.value = service;
  showRemoveDialog.value = true;
};

const confirmRemove = async () => {
  if (!serviceToRemove.value) return;
  removingServiceId.value = serviceToRemove.value.id;

  try {
    await removeService.execute(serviceToRemove.value.id);
    setStatus({
      type: "success",
      text: `Removed service "${serviceToRemove.value.name}".`,
    });
    await refresh();
  } catch (err) {
    setStatus({
      type: "error",
      text:
        err instanceof Error ? err.message : "Failed to remove PDP service.",
    });
  } finally {
    removingServiceId.value = null;
    showRemoveDialog.value = false;
    serviceToRemove.value = null;
  }
};

const cancelRemove = () => {
  showRemoveDialog.value = false;
  serviceToRemove.value = null;
};

const isRemoveInProgress = (service: PdpService) => {
  return (
    removingServiceId.value !== null && removingServiceId.value === service.id
  );
};

const serviceList = computed(() => services.value ?? []);

const hasServices = computed(() => serviceList.value.length > 0);

const isLoading = computed(() => loading.value);
const isSubmitting = computed(() => addService.loading.value);
const isInitialLoading = computed(() => isLoading.value && !hasServices.value);
</script>

<template>
  <SectionCard title="PDP Services" :icon="ShieldCheckIcon">
    <template #actions>
      <div class="flex items-center gap-2">
        <button
          class="btn btn-ghost btn-sm"
          title="Refresh services"
          :disabled="isLoading"
          @click="refresh"
        >
          <ArrowPathIcon class="size-4" />
        </button>
        <button
          class="btn btn-primary btn-sm"
          :disabled="isSubmitting"
          @click="handleOpenModal"
        >
          <PlusIcon class="size-4" />
          Add Service
        </button>
      </div>
    </template>

    <div
      v-if="status"
      :class="[
        'flex items-start gap-3 rounded-lg border px-3 py-2 text-sm',
        status.type === 'success'
          ? 'border-success bg-success/10 text-success'
          : 'border-error bg-error/10 text-error',
      ]"
    >
      <InformationCircleIcon class="size-4" />
      <div class="flex-1">
        <p class="font-medium">{{ status.text }}</p>
      </div>
      <button class="btn btn-ghost btn-xs" @click="setStatus(null)">×</button>
    </div>

    <div v-if="error" class="alert alert-error">
      <div>
        <h3 class="font-semibold">Unable to load services</h3>
        <p class="text-sm">{{ error?.message }}</p>
      </div>
    </div>

    <div
      v-else-if="isInitialLoading"
      class="text-base-content flex flex-col items-center justify-center gap-3 py-12"
    >
      <span class="loading loading-spinner loading-lg"></span>
      Loading services...
    </div>

    <div
      v-else-if="!hasServices"
      class="border-base-300 bg-base-100 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center"
    >
      <p class="text-base-content text-sm">No PDP services found.</p>
      <button class="btn btn-primary btn-sm" @click="handleOpenModal">
        <PlusIcon class="size-4" />
        Add Service
      </button>
    </div>

    <div v-else class="border-base-300 overflow-hidden rounded-lg border">
      <div class="overflow-x-auto">
        <table class="table-zebra table">
          <thead>
            <tr class="text-base-content text-xs tracking-wide uppercase">
              <th class="w-16">ID</th>
              <th>Name</th>
              <th>Public Key</th>
              <th class="w-32 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in serviceList" :key="service.id">
              <td class="font-mono text-sm">{{ service.id }}</td>
              <td class="font-medium">{{ service.name }}</td>
              <td class="max-w-md">
                <div class="flex items-center gap-2">
                  <code class="text-base-content text-xs">
                    {{ service.pubkey.slice(0, 32)
                    }}{{ service.pubkey.length > 32 ? "…" : "" }}
                  </code>
                  <CopyButton
                    :value="service.pubkey"
                    icon-only
                    :aria-label="`Copy public key for ${service.name}`"
                  />
                </div>
              </td>
              <td class="text-center">
                <button
                  class="btn btn-ghost btn-xs text-error"
                  :disabled="isRemoveInProgress(service)"
                  @click="requestRemove(service)"
                >
                  <span
                    v-if="isRemoveInProgress(service)"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  <span v-else class="inline-flex items-center gap-1">
                    <TrashIcon class="size-4" />
                    Remove
                  </span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal
      :open="showAddModal"
      title="Add PDP Service"
      size="md"
      @close="showAddModal = false"
    >
      <form
        id="pdp-service-form"
        class="flex flex-col gap-4 py-4"
        @submit.prevent="handleSubmit"
      >
        <label class="form-control w-full">
          <span class="label">
            <span class="label-text font-medium">Service Name</span>
            <span class="label-text-alt">e.g. filecoin-us-west</span>
          </span>
          <input
            v-model="serviceForm.name"
            type="text"
            class="input input-bordered w-full"
            :disabled="isSubmitting"
            placeholder="Service name"
            autofocus
          />
        </label>

        <label class="form-control w-full">
          <span class="label">
            <span class="label-text font-medium">Public Key</span>
            <span class="label-text-alt">Paste the service public key</span>
          </span>
          <textarea
            v-model="serviceForm.publicKey"
            class="textarea textarea-bordered h-32 w-full"
            :disabled="isSubmitting"
            placeholder="Multibase-encoded public key"
          ></textarea>
        </label>

        <p v-if="localFormError" class="text-error text-sm">
          {{ localFormError }}
        </p>
      </form>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="isSubmitting"
            @click="showAddModal = false"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting"
            form="pdp-service-form"
          >
            <span
              v-if="isSubmitting"
              class="loading loading-spinner loading-xs"
            ></span>
            Add Service
          </button>
        </div>
      </template>
    </BaseModal>

    <ConfirmationDialog
      v-model:show="showRemoveDialog"
      title="Remove PDP Service"
      :message="removeDialogMessage"
      confirm-text="Remove"
      cancel-text="Cancel"
      type="danger"
      :loading="removeDialogLoading"
      @confirm="confirmRemove"
      @cancel="cancelRemove"
    />
  </SectionCard>
</template>
