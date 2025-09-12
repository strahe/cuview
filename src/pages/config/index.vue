<template>
  <div class="config-page min-h-screen bg-base-50">
    <div class="container mx-auto px-4 py-6">
      <!-- Page header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <CogIcon class="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 class="text-3xl font-bold text-base-content">Configuration</h1>
            <p class="text-base-content/70">
              Manage Curio configuration layers with an intuitive interface
            </p>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <LayerManagement />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CogIcon } from "@heroicons/vue/24/outline";
import LayerManagement from "./components/LayerManagement.vue";
</script>

<style scoped>
.config-page {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
}
</style>
