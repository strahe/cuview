<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useConfigStore } from "@/stores/config";

const router = useRouter();
const configStore = useConfigStore();

// Initialize config and handle routing
onMounted(() => {
  configStore.initializeFromEnv();
  
  // Check if endpoint is configured
  if (configStore.isConfigured) {
    router.replace("/overview");
  } else {
    router.replace("/setup");
  }
});
</script>

<template>
  <!-- Loading state while redirecting -->
  <div class="hero bg-base-200 min-h-screen">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
        <p class="text-lg">Loading Curio Overview...</p>
      </div>
    </div>
  </div>
</template>
