<script setup lang="ts">
import { computed } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "reka-ui";

interface Props {
  open: boolean;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  modal?: boolean;
}

interface Emits {
  (e: "close"): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  size: "md",
  showCloseButton: true,
  modal: false,
});

const emit = defineEmits<Emits>();

// Size classes mapping
const sizeClasses = computed(() => {
  const sizes = {
    sm: "sm:max-w-md",
    md: "sm:max-w-xl",
    lg: "sm:max-w-3xl",
    xl: "sm:max-w-5xl",
  };
  return sizes[props.size];
});

// Handle close event
const handleClose = () => {
  emit("close");
};
</script>

<template>
  <DialogRoot
    :open="open"
    :modal="modal"
    @update:open="(value) => !value && handleClose()"
  >
    <DialogPortal>
      <Transition
        name="fade"
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <DialogOverlay
          v-if="open"
          force-mount
          class="bg-base-300 bg-opacity-60 fixed inset-0 z-50 backdrop-blur-sm"
        />
      </Transition>

      <div
        class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <Transition
          name="modal"
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <DialogContent
            v-if="open"
            force-mount
            class="bg-base-100 pointer-events-auto relative max-h-[90vh] w-full overflow-hidden rounded-lg text-left shadow-xl"
            :class="sizeClasses"
          >
            <!-- Header -->
            <div
              v-if="title || showCloseButton"
              class="border-base-300 flex items-center justify-between border-b p-6 pb-4"
            >
              <DialogTitle v-if="title" class="text-lg leading-6 font-semibold">
                {{ title }}
              </DialogTitle>
              <div v-else></div>
              <DialogClose
                v-if="showCloseButton"
                class="btn btn-ghost btn-sm btn-circle"
                title="Close"
              >
                <XMarkIcon class="size-4" />
              </DialogClose>
            </div>

            <!-- Content -->
            <div
              class="overflow-y-auto px-6"
              :class="{
                'pt-6': !title && !showCloseButton,
                'max-h-[calc(90vh-8rem)]':
                  title || showCloseButton || $slots.footer,
                'max-h-[calc(90vh-3rem)]':
                  !title && !showCloseButton && !$slots.footer,
              }"
            >
              <slot />
            </div>

            <!-- Footer slot -->
            <div
              v-if="$slots.footer"
              class="bg-base-100 border-base-300 border-t p-6 pt-4"
            >
              <slot name="footer" />
            </div>
          </DialogContent>
        </Transition>
      </div>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.modal-enter-active {
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active {
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.modal-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.modal-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.modal-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

@media (max-width: 640px) {
  .modal-enter-from,
  .modal-leave-to {
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
