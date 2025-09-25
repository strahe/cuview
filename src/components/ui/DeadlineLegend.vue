<script setup lang="ts">
const legendItems = [
  { color: "bg-success", label: "Proven" },
  { color: "bg-warning", label: "Partially Faulty" },
  { color: "bg-error", label: "Faulty" },
  { color: "bg-info", label: "Current" },
];
</script>

<template>
  <div class="flex flex-wrap gap-4 text-sm">
    <div
      v-for="item in legendItems"
      :key="item.label"
      class="flex items-center gap-2"
    >
      <div :class="[item.color, 'h-4 w-4 rounded-sm']"></div>
      <span class="text-base-content/80">{{ item.label }}</span>
    </div>
  </div>
</template>
