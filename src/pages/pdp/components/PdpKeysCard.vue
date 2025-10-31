<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";

import SectionCard from "@/components/ui/SectionCard.vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useLazyQuery } from "@/composables/useLazyQuery";
import type { PdpKeyPayload } from "../types";

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

const {
  data: owners,
  loading,
  error,
  refresh,
} = useCachedQuery<string[]>("ListPDPKeys", [], {
  pollingInterval: 30000,
});

const importKey = useLazyQuery<string>("ImportPDPKey");
const removeKey = useLazyQuery<void>("RemovePDPKey");

const status = ref<StatusMessage | null>(null);

const showImportModal = ref(false);
const keyForm = reactive({
  privateKey: "",
});
const localFormError = ref("");
const removingOwner = ref<string | null>(null);

const resetForm = () => {
  keyForm.privateKey = "";
  localFormError.value = "";
};

const handleOpenModal = () => {
  resetForm();
  showImportModal.value = true;
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
  const payload: PdpKeyPayload = {
    privateKey: keyForm.privateKey.trim(),
  };

  if (!payload.privateKey) {
    localFormError.value = "Private key is required.";
    return;
  }

  localFormError.value = "";

  try {
    const address = await importKey.execute(payload.privateKey);
    const message = address
      ? `Imported key for address ${address}.`
      : "PDP key imported.";
    setStatus({ type: "success", text: message });
    showImportModal.value = false;
    resetForm();
    await refresh();
  } catch (err) {
    localFormError.value =
      err instanceof Error ? err.message : "Failed to import key.";
  }
};

const ownerToRemove = ref<string | null>(null);
const showRemoveDialog = ref(false);

const removeDialogMessage = computed(() =>
  ownerToRemove.value
    ? `Remove key for ${ownerToRemove.value}? This action cannot be undone.`
    : "",
);

const removeDialogLoading = computed(
  () =>
    ownerToRemove.value !== null && ownerToRemove.value === removingOwner.value,
);

const requestRemove = (owner: string) => {
  ownerToRemove.value = owner;
  showRemoveDialog.value = true;
};

const confirmRemove = async () => {
  if (!ownerToRemove.value) return;
  removingOwner.value = ownerToRemove.value;

  try {
    await removeKey.execute(ownerToRemove.value);
    setStatus({
      type: "success",
      text: `Removed key for ${ownerToRemove.value}.`,
    });
    await refresh();
  } catch (err) {
    setStatus({
      type: "error",
      text: err instanceof Error ? err.message : "Failed to remove key.",
    });
  } finally {
    removingOwner.value = null;
    showRemoveDialog.value = false;
    ownerToRemove.value = null;
  }
};

const cancelRemove = () => {
  showRemoveDialog.value = false;
  ownerToRemove.value = null;
};

const isRemoveInProgress = (owner: string) => {
  return removingOwner.value !== null && removingOwner.value === owner;
};

const ownerList = computed(() => owners.value ?? []);
const hasKeys = computed(() => ownerList.value.length > 0);
const isLoading = computed(() => loading.value);
const isImporting = computed(() => importKey.loading.value);
const isInitialLoading = computed(() => isLoading.value && !hasKeys.value);
</script>

<template>
  <SectionCard title="PDP Keys" :icon="KeyIcon">
    <template #actions>
      <div class="flex items-center gap-2">
        <button
          class="btn btn-ghost btn-sm"
          title="Refresh keys"
          :disabled="isLoading"
          @click="refresh"
        >
          <ArrowPathIcon class="size-4" />
        </button>
        <button
          class="btn btn-primary btn-sm"
          :disabled="isImporting"
          @click="handleOpenModal"
        >
          <PlusIcon class="size-4" />
          Import Key
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
        <h3 class="font-semibold">Unable to load keys</h3>
        <p class="text-sm">{{ error?.message }}</p>
      </div>
    </div>

    <div
      v-else-if="isInitialLoading"
      class="text-base-content flex flex-col items-center justify-center gap-3 py-12"
    >
      <span class="loading loading-spinner loading-lg"></span>
      Loading keys...
    </div>

    <div
      v-else-if="!hasKeys"
      class="border-base-300 bg-base-100 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center"
    >
      <p class="text-base-content text-sm">No PDP keys imported.</p>
    </div>

    <div v-else class="border-base-300 overflow-hidden rounded-lg border">
      <div class="overflow-x-auto">
        <table class="table-zebra table">
          <thead>
            <tr class="text-base-content text-xs tracking-wide uppercase">
              <th>Owner Address</th>
              <th class="w-32 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="owner in ownerList" :key="owner">
              <td class="flex items-center gap-2 font-mono text-sm">
                <span class="truncate">{{ owner }}</span>
                <CopyButton
                  :value="owner"
                  icon-only
                  :aria-label="`Copy owner address ${owner}`"
                />
              </td>
              <td class="text-center">
                <button
                  class="btn btn-ghost btn-xs text-error"
                  :disabled="isRemoveInProgress(owner)"
                  @click="requestRemove(owner)"
                >
                  <span
                    v-if="isRemoveInProgress(owner)"
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
      :open="showImportModal"
      title="Import PDP Key"
      size="md"
      @close="showImportModal = false"
    >
      <form
        id="pdp-key-form"
        class="flex flex-col gap-4 py-4"
        @submit.prevent="handleSubmit"
      >
        <label class="form-control w-full">
          <span class="label">
            <span class="label-text font-medium">Private Key (Hex)</span>
            <span class="label-text-alt">Use with caution.</span>
          </span>
          <textarea
            v-model="keyForm.privateKey"
            class="textarea textarea-bordered h-32 w-full"
            :disabled="isImporting"
            placeholder="0x..."
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
            :disabled="isImporting"
            @click="showImportModal = false"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isImporting"
            form="pdp-key-form"
          >
            <span
              v-if="isImporting"
              class="loading loading-spinner loading-xs"
            ></span>
            Import Key
          </button>
        </div>
      </template>
    </BaseModal>

    <ConfirmationDialog
      v-model:show="showRemoveDialog"
      title="Remove PDP Key"
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
