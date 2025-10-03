<script setup lang="ts">
import { computed } from "vue";

interface Props {
  columns?: 1 | 2 | 3;
  gap?: string;
}

const props = withDefaults(defineProps<Props>(), {
  columns: 1,
  gap: "gap-4",
});

const gridClass = computed(() => {
  switch (props.columns) {
    case 3:
      return `grid ${props.gap} md:grid-cols-3`;
    case 2:
      return `grid ${props.gap} md:grid-cols-2`;
    default:
      return `grid ${props.gap}`;
  }
});
</script>

<template>
  <div :class="gridClass">
    <slot />
  </div>
</template>
