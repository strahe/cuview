<route>
{
  "meta": {
    "title": "Storage"
  }
}
</route>

<script setup lang="ts">
import {
  CircleStackIcon,
  TrashIcon,
  ServerIcon,
} from "@heroicons/vue/24/outline";
import StorageOverviewStats from "./components/StorageOverviewStats.vue";
import StoragePathsTable from "./components/StoragePathsTable.vue";
import StorageGCManagement from "./components/StorageGCManagement.vue";
import SectionCard from "@/components/ui/SectionCard.vue";
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
      <StoragePathsTable />
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
