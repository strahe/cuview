<script setup lang="ts">
import { useCachedQuery } from "@/composables/useCachedQuery";
import { LinkIcon } from "@heroicons/vue/24/outline";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import { getTableRowClasses } from "@/utils/ui";
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
    error-title="Chain Connection Error"
    :empty-icon="LinkIcon"
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
        <tr
          v-for="item in syncerData"
          :key="item.Address"
          :class="getTableRowClasses()"
        >
          <td class="font-mono text-sm">{{ item.Address }}</td>
          <td>
            <span
              v-if="item.Reachable"
              class="text-success text-sm font-medium"
            >
              ok
            </span>
            <span v-else class="text-error text-sm font-medium">FAIL</span>
          </td>
          <td>
            <span
              v-if="item.SyncState === 'ok'"
              class="text-success text-sm font-medium"
            >
              ok
            </span>
            <span v-else class="text-warning text-sm font-medium">
              No{{ item.SyncState ? ", " + item.SyncState : "" }}
            </span>
          </td>
          <td class="text-sm">{{ item.Version }}</td>
        </tr>
      </tbody>
    </DataTable>
  </DataSection>
</template>
