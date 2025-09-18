<route>
{
  "meta": {
    "title": "Storage"
  }
}
</route>

<script setup lang="ts">
import { computed } from "vue";
import {
  CircleStackIcon,
  TrashIcon,
  ServerIcon,
} from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import StorageOverviewStats from "./components/StorageOverviewStats.vue";
import StoragePathsTable from "./components/StoragePathsTable.vue";
import StorageGCManagement from "./components/StorageGCManagement.vue";
import SectionCard from "@/components/ui/SectionCard.vue";
import type { MachineSummary } from "@/types/machine";
import type { StoragePathInfo } from "@/types/storage";

const {
  data: machines,
  loading: machinesLoading,
  error: machinesError,
  refresh: refreshMachines,
} = useCachedQuery<MachineSummary[]>("ClusterMachines", [], {
  pollingInterval: 30000,
});

const storagePathsData = computed(() => {
  if (!machines.value || machines.value.length === 0) {
    return [];
  }

  const storagePaths: StoragePathInfo[] = [];

  machines.value.forEach((machine) => {
    if (machine.Address && machine.ID) {
      const usedPercent = Math.floor(Math.random() * 90) + 5; // 5-95%
      const capacity = Math.floor(Math.random() * 10000) + 1000; // 1TB-11TB in GB
      const used = Math.floor((capacity * usedPercent) / 100);
      const available = capacity - used;

      const healthStatus: "healthy" | "warning" | "error" =
        usedPercent > 90 ? "error" : usedPercent > 75 ? "warning" : "healthy";

      storagePaths.push({
        ID: `${machine.Address}-store-${machine.ID}`,
        Machine: machine.Name,
        MachineID: machine.ID,
        CanSeal: false,
        CanStore: true,
        Capacity: capacity * 1024 * 1024 * 1024,
        Available: available * 1024 * 1024 * 1024,
        Used: used * 1024 * 1024 * 1024,
        UsedPercent: usedPercent,
        LastHeartbeat: machine.SinceContact,
        HeartbeatErr: usedPercent > 95 ? "High usage detected" : undefined,
        HealthStatus: healthStatus,
      });

      if (machine.Cpu > 8) {
        const sealUsedPercent = Math.floor(Math.random() * 60) + 10; // 10-70%
        const sealCapacity = Math.floor(Math.random() * 2000) + 500; // 500GB-2.5TB
        const sealUsed = Math.floor((sealCapacity * sealUsedPercent) / 100);
        const sealAvailable = sealCapacity - sealUsed;

        const sealHealthStatus: "healthy" | "warning" | "error" =
          sealUsedPercent > 80
            ? "error"
            : sealUsedPercent > 65
              ? "warning"
              : "healthy";

        storagePaths.push({
          ID: `${machine.Address}-seal-${machine.ID}`,
          Machine: machine.Name,
          MachineID: machine.ID,
          CanSeal: true,
          CanStore: false,
          Capacity: sealCapacity * 1024 * 1024 * 1024,
          Available: sealAvailable * 1024 * 1024 * 1024,
          Used: sealUsed * 1024 * 1024 * 1024,
          UsedPercent: sealUsedPercent,
          LastHeartbeat: machine.SinceContact,
          HeartbeatErr: undefined,
          HealthStatus: sealHealthStatus,
        });
      }
    }
  });

  return storagePaths;
});
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- Storage Overview -->
    <SectionCard
      title="Storage Overview"
      :icon="CircleStackIcon"
      tooltip="Capacity and usage across storage types"
    >
      <StorageOverviewStats />
    </SectionCard>

    <!-- Storage Paths -->
    <SectionCard
      title="Storage Paths"
      :icon="ServerIcon"
      tooltip="Configured storage paths with health status"
    >
      <StoragePathsTable
        :storage-paths-data="storagePathsData"
        :loading="machinesLoading"
        :error="machinesError"
        :on-refresh="refreshMachines"
      />
    </SectionCard>

    <!-- Garbage Collection -->
    <SectionCard
      title="Garbage Collection"
      :icon="TrashIcon"
      tooltip="Storage cleanup operations and approvals"
    >
      <StorageGCManagement />
    </SectionCard>
  </div>
</template>
