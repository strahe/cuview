<script setup lang="ts" generic="T">
import BaseModal from "@/components/ui/BaseModal.vue";

interface Props {
  show: boolean;
  item: T | null;
  dialogClass?: string;
  ariaLabel?: string;
  ariaDescription?: string;
}

interface Emits {
  (e: "update:show", value: boolean): void;
  (e: "close"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dialogClass: "max-w-2xl w-full",
  ariaLabel: "Item details dialog",
  ariaDescription: "Detailed information about the selected record.",
});
const emit = defineEmits<Emits>();

const handleClose = () => {
  emit("update:show", false);
  emit("close");
};
</script>

<template>
  <BaseModal
    :open="props.show"
    size="xl"
    :modal="true"
    :show-close-button="false"
    :content-class="props.dialogClass"
    :aria-label="props.ariaLabel"
    :description="props.ariaDescription"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <slot name="title" :item="item">
            <h3 class="text-lg font-bold">Item Details</h3>
          </slot>
        </div>
        <button class="btn btn-ghost btn-sm" @click="handleClose">✕</button>
      </div>

      <slot name="header-stats" :item="item" />

      <slot name="main-content" :item="item" />

      <slot name="actions" :item="item" />
    </div>
  </BaseModal>
</template>
