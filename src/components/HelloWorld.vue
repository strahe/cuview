<script setup lang="ts">
import { useCurioQuery } from '@/composables/useCurioQuery'

// Get Curio version
const api = useCurioQuery()
const { data: version, loading, error } = api.version()
</script>

<template>
  <div class="card">
    <h2>Curio API Status</h2>
    <div v-if="loading" class="status loading">
      <span class="spinner"></span>
      Connecting...
    </div>
    <div v-else-if="error" class="status error">
      ❌ Connection failed: {{ error.message }}
    </div>
    <div v-else-if="version" class="status success">
      ✅ Connected - Version: {{ Array.isArray(version) ? version.join('.') : version }}
    </div>
  </div>
</template>

<style scoped>
.status {
  padding: 12px;
  border-radius: 8px;
  margin: 8px 0;
  font-weight: 500;
}

.status.loading {
  background-color: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.status.error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.status.success {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #0369a1;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
