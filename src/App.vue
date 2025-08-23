<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "@/layouts/AppLayout.vue";

const route = useRoute();

// Pages that should not use the main layout
const standalonePages = ["/setup"];
const useLayout = computed(() => !standalonePages.includes(route.path));
</script>

<template>
  <AppLayout v-if="useLayout">
    <router-view />
  </AppLayout>
  <router-view v-else />
</template>
