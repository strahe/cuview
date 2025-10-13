<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "@/layouts/AppLayout.vue";

const route = useRoute();

const standaloneRoutes = new Set<string>(["/setup"]);

const useLayout = computed(() => {
  if (route.meta?.layout === "standalone") {
    return false;
  }

  return !standaloneRoutes.has(route.path);
});
</script>

<template>
  <AppLayout v-if="useLayout">
    <router-view />
  </AppLayout>
  <router-view v-else />
</template>
