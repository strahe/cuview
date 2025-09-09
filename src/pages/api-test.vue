<template>
  <div class="container mx-auto max-w-4xl p-6">
    <h1 class="mb-6 text-3xl font-bold">Curio REST API Test</h1>

    <!-- Config APIs Section -->
    <div class="card bg-base-100 mb-6 shadow-md">
      <div class="card-body">
        <h2 class="card-title">Config APIs</h2>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            class="btn btn-primary"
            :disabled="loading"
            @click="testGetLayers"
          >
            Get Config Layers
          </button>
          <button
            class="btn btn-primary"
            :disabled="loading"
            @click="testGetSchema"
          >
            Get Config Schema
          </button>
          <button
            class="btn btn-primary"
            :disabled="loading"
            @click="testGetDefault"
          >
            Get Default Config
          </button>
          <button
            class="btn btn-primary"
            :disabled="loading"
            @click="testGetTopology"
          >
            Get Topology
          </button>
        </div>
      </div>
    </div>

    <!-- Sector APIs Section -->
    <div class="card bg-base-100 mb-6 shadow-md">
      <div class="card-body">
        <h2 class="card-title">Sector APIs</h2>

        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="testGetSectors"
        >
          Get All Sectors
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="result" class="card bg-base-100 shadow-md">
      <div class="card-body">
        <h2 class="card-title">Results</h2>
        <div class="mockup-code">
          <pre><code>{{ JSON.stringify(result, null, 2) }}</code></pre>
        </div>
      </div>
    </div>

    <!-- Error Section -->
    <div v-if="error" class="alert alert-error mt-4">
      <span>{{ error }}</span>
    </div>

    <!-- Loading indicator -->
    <div
      v-if="loading"
      class="loading loading-spinner loading-lg mx-auto mt-4"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { CurioApiService } from "@/services/curio-api";

const loading = ref(false);
const result = ref<unknown>(null);
const error = ref<string>("");

const apiService = new CurioApiService();

const executeWithLoading = async (fn: () => Promise<unknown>) => {
  loading.value = true;
  error.value = "";
  result.value = null;

  try {
    result.value = await fn();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    loading.value = false;
  }
};

const testGetLayers = () =>
  executeWithLoading(() => apiService.getConfigLayers());
const testGetSchema = () =>
  executeWithLoading(() => apiService.getConfigSchema());
const testGetDefault = () =>
  executeWithLoading(() => apiService.getDefaultConfig());
const testGetTopology = () =>
  executeWithLoading(() => apiService.getTopology());
const testGetSectors = () =>
  executeWithLoading(() => apiService.getAllSectors());
</script>
