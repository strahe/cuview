<template>
  <div
    v-if="showStats && statsText"
    class="text-base-content/60 space-y-0.5 text-xs"
  >
    <div>{{ statsText }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showStats: boolean;
  statsText?: string;
}>();
</script>
