<script setup lang="ts">
import { computed } from "vue";
import Card from "./Card.vue";

interface Props {
  title?: string;
  description?: string;
  icon?: unknown;
  loading?: boolean;
  class?: string;
}

const props = defineProps<Props>();

const iconComponent = computed(() => props.icon);
</script>

<template>
  <Card
    :title="title"
    :description="description"
    :icon="iconComponent"
    :loading="loading"
    :class="props.class"
  >
    <slot />
  </Card>
</template>
