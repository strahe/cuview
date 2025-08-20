<script setup lang="ts">
import { computed } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import DataTable from "@/components/ui/DataTable.vue";
import type { SyncerStateItem } from "@/types/sync";

const {
  data: syncerData,
  loading,
  error,
  hasData,
} = useCachedQuery<SyncerStateItem[]>("SyncerState", [], {
  pollingInterval: 30000,
});

const isInitialLoading = computed(() => loading.value && !hasData.value);
</script>

<template>
  <div class="space-y-4">
    <DataTable>
      <thead>
        <tr>
          <th>RPC Address</th>
          <th>Reachability</th>
          <th>Sync Status</th>
          <th>Version</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in syncerData" :key="item.Address">
          <td class="font-mono text-sm">{{ item.Address }}</td>
          <td>
            <div v-if="item.Reachable" class="badge badge-success">ok</div>
            <div v-else class="badge badge-error">FAIL</div>
          </td>
          <td>
            <div v-if="item.SyncState === 'ok'" class="badge badge-success">
              ok
            </div>
            <div v-else class="badge badge-warning">
              No{{ item.SyncState ? ", " + item.SyncState : "" }}
            </div>
          </td>
          <td class="text-base-content/70 text-sm">{{ item.Version }}</td>
        </tr>
      </tbody>
    </DataTable>

    <div v-if="isInitialLoading" class="text-base-content/60 py-8 text-center">
      <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
      Connecting to blockchain...
    </div>

    <div v-else-if="error" class="text-error py-8 text-center">
      <div class="mb-2 text-lg">🔗 Connection Failed</div>
      <div class="text-sm">{{ error.message }}</div>
    </div>

    <div
      v-else-if="!syncerData || (syncerData.length === 0 && !loading)"
      class="text-base-content/60 py-8 text-center"
    >
      <div class="mb-2 text-4xl">🔗</div>
      <div>No RPC connections configured</div>
    </div>
  </div>
</template>
