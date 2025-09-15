<template>
  <div class="config-page bg-base-50 min-h-screen">
    <div class="container mx-auto px-4 py-6">
      <!-- Page header -->
      <div class="mb-8">
        <div class="mb-2 flex items-center gap-3">
          <div
            class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg"
          >
            <CogIcon class="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 class="text-base-content text-3xl font-bold">Configuration</h1>
            <p class="text-base-content/70">
              Manage Curio configuration layers with an intuitive interface
            </p>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <ConfigLayerList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CogIcon } from "@heroicons/vue/24/outline";
import ConfigLayerList from "./components/ConfigLayerList.vue";
</script>

<style scoped>
.config-page {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
}
</style>
