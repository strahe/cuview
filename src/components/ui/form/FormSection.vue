<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  description: "",
});
</script>

<template>
  <section class="flex flex-col gap-4">
    <header v-if="props.title || props.description" class="flex flex-col gap-1">
      <h3 v-if="props.title" class="text-base-content text-sm font-semibold">
        {{ props.title }}
      </h3>
      <p v-if="props.description" class="text-base-content/60 text-xs">
        {{ props.description }}
      </p>
    </header>
    <slot />
  </section>
</template>
