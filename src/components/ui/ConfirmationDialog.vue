<script setup lang="ts">
import { computed } from "vue";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import {
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from "reka-ui";

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

const handleOpenChange = (open: boolean) => {
  if (!open) {
    handleCancel();
  }
};

const getIconClass = computed(() => {
  switch (props.type) {
    case "danger":
      return "text-error";
    case "info":
      return "text-info";
    default:
      return "text-warning";
  }
});

const getButtonClass = computed(() => {
  switch (props.type) {
    case "danger":
      return "btn-error";
    case "info":
      return "btn-info";
    default:
      return "btn-warning";
  }
});
</script>

<template>
  <AlertDialogRoot :open="show" :modal="false" @update:open="handleOpenChange">
    <AlertDialogPortal>
      <Transition
        name="fade"
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <AlertDialogOverlay
          v-if="show"
          force-mount
          class="app-modal-overlay z-50"
        />
      </Transition>

      <div
        class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <Transition
          name="confirmation-dialog"
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <AlertDialogContent
            v-if="show"
            force-mount
            class="bg-base-100 pointer-events-auto relative w-full max-w-md rounded-lg shadow-xl"
          >
            <div class="p-6">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                  <ExclamationTriangleIcon :class="['size-6', getIconClass]" />
                </div>

                <div class="min-w-0 flex-1">
                  <AlertDialogTitle class="text-lg leading-6 font-semibold">
                    {{ title }}
                  </AlertDialogTitle>
                  <AlertDialogDescription
                    v-if="message || !!$slots.description"
                    class="text-base-content/70 mt-2 text-sm"
                  >
                    <slot name="description">
                      {{ message }}
                    </slot>
                  </AlertDialogDescription>
                </div>

                <button
                  class="btn btn-ghost btn-sm btn-circle"
                  title="Close"
                  :disabled="loading"
                  @click="handleCancel"
                >
                  <XMarkIcon class="size-4" />
                </button>
              </div>

              <div class="mt-6 flex justify-end gap-3">
                <button
                  class="btn btn-ghost"
                  :disabled="loading"
                  @click="handleCancel"
                >
                  {{ cancelText }}
                </button>
                <button
                  :class="['btn', getButtonClass]"
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
          </AlertDialogContent>
        </Transition>
      </div>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<style scoped>
.confirmation-dialog-enter-active {
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.confirmation-dialog-leave-active {
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.confirmation-dialog-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.confirmation-dialog-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.confirmation-dialog-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.confirmation-dialog-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

@media (max-width: 640px) {
  .confirmation-dialog-enter-from,
  .confirmation-dialog-leave-to {
    transform: translateY(-4px) scale(0.95);
  }
}

.fade-enter-active {
  transition: opacity 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-leave-active {
  transition: opacity 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
