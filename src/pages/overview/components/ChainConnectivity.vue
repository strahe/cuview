<script setup lang="ts">
import { useCachedQuery } from "@/composables/useCachedQuery";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import type { SyncerStateItem } from "@/types/sync";

const {
  data: syncerData,
  loading,
  error,
  hasData,
  refresh,
} = useCachedQuery<SyncerStateItem[]>("SyncerState", [], {
  pollingInterval: 30000,
});
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData"
    :on-retry="refresh"
    error-title="Connection Failed"
    empty-icon="🔗"
    empty-message="No RPC connections configured"
  >
    <template #loading>Connecting to blockchain...</template>

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
  </DataSection>
</template>
