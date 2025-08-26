<script setup lang="ts">
import { useLayoutStore } from "@/stores/layout";
import { SunIcon, MoonIcon } from "@heroicons/vue/24/outline";

const layoutStore = useLayoutStore();
</script>

<template>
  <button
    class="btn btn-ghost btn-sm size-9 p-0"
    :title="layoutStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="layoutStore.toggleTheme"
  >
    <SunIcon v-if="layoutStore.isDark" class="size-5" />
    <MoonIcon v-else class="size-5" />
  </button>
</template>
