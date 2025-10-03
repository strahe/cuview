<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
}

const { title, description } = withDefaults(defineProps<Props>(), {
  title: "",
  description: "",
});
</script>

<template>
  <section class="flex flex-col gap-4">
    <header v-if="title || description" class="flex flex-col gap-1">
      <h3 v-if="title" class="text-base-content text-sm font-semibold">
        {{ title }}
      </h3>
      <p v-if="description" class="text-base-content/60 text-xs">
        {{ description }}
      </p>
    </header>
    <slot />
  </section>
</template>
