<template>
  <!-- Use simple modal approach without portal -->
  <div v-if="show" class="modal modal-open">
    <div class="modal-box max-w-2xl">
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
    <div class="modal-backdrop" @click="handleClose"></div>
  </div>
</template>

<script setup lang="ts" generic="T">
interface Props {
  show: boolean;
  item: T | null;
}

interface Emits {
  (e: "update:show", value: boolean): void;
  (e: "close"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleClose = () => {
  emit("update:show", false);
  emit("close");
};

// Handle escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && props.show) {
    handleClose();
  }
});
</script>
