<script setup lang="ts">
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/vue/24/outline";

interface Props {
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "danger" | "info";
  loading?: boolean;
}

interface Emits {
  (e: "confirm"): void;
  (e: "cancel"): void;
  (e: "update:show", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: "Confirm",
  cancelText: "Cancel",
  type: "warning",
  loading: false,
});

const emit = defineEmits<Emits>();

const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  emit("cancel");
  emit("update:show", false);
};

const getIconClass = () => {
  switch (props.type) {
    case "danger":
      return "text-error";
    case "info":
      return "text-info";
    default:
      return "text-warning";
  }
};

const getButtonClass = () => {
  switch (props.type) {
    case "danger":
      return "btn-error";
    case "info":
      return "btn-info";
    default:
      return "btn-warning";
  }
};
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click="handleCancel"
  >
    <div
      class="bg-base-100 m-4 w-full max-w-md rounded-lg p-6 shadow-xl"
      @click.stop
    >
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <ExclamationTriangleIcon :class="['size-6', getIconClass()]" />
        </div>

        <div class="min-w-0 flex-1">
          <h3 class="text-lg leading-6 font-semibold">
            {{ title }}
          </h3>
          <p class="text-base-content/70 mt-2 text-sm">
            {{ message }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm"
          :disabled="loading"
          @click="handleCancel"
        >
          <XMarkIcon class="size-4" />
        </button>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button class="btn btn-ghost" :disabled="loading" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button
          :class="['btn', getButtonClass()]"
          :disabled="loading"
          @click="handleConfirm"
        >
          <span
            v-if="loading"
            class="loading loading-spinner loading-sm"
          ></span>
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>
