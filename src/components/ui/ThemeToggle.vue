<script setup lang="ts">
import { computed } from "vue";
import { useLayoutStore } from "@/stores/layout";
import { getNextTheme, getThemeDefinition } from "@/lib/theme";
import { SunIcon, MoonIcon } from "@heroicons/vue/24/outline";

const layoutStore = useLayoutStore();

const targetTheme = computed(() => getNextTheme(layoutStore.theme));
const toggleLabel = computed(() => {
  const definition = getThemeDefinition(targetTheme.value);
  return `Switch to ${definition.label}`;
});
</script>

<template>
  <button
    type="button"
    class="btn btn-ghost btn-sm size-9 p-0"
    :title="toggleLabel"
    :aria-label="toggleLabel"
    @click="layoutStore.toggleTheme"
  >
    <SunIcon v-if="layoutStore.isDark" class="size-5" />
    <MoonIcon v-else class="size-5" />
  </button>
</template>
