<template>
  <div class="space-y-6 p-6">
    <!-- Cluster Overview Stats -->
    <div class="space-y-4">
      <h2 class="text-base-content text-xl font-semibold">Cluster Overview</h2>
      <ClusterStats />
    </div>

    <!-- Chain Connectivity -->
    <SectionCard
      title="Chain Connectivity"
      description="Blockchain RPC connections and sync status"
      :icon="LinkIcon"
    >
      <ChainConnectivity />
    </SectionCard>

    <!-- Detailed Information Row -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <!-- Storage Stats -->
      <SectionCard
        title="Storage Usage"
        description="Disk utilization across storage types"
        :icon="ServerStackIcon"
      >
        <StorageStats />
      </SectionCard>

      <!-- Task Counts -->
      <SectionCard
        title="Task Statistics"
        description="Harmony task success rates and status"
        :icon="ChartBarIcon"
      >
        <TaskCounts />
      </SectionCard>
    </div>

    <!-- Machines & Infrastructure -->
    <SectionCard
      title="Cluster Machines"
      description="Hardware status and task scheduling across the cluster"
      :icon="ServerIcon"
    >
      <ClusterMachines />
    </SectionCard>

    <!-- Actor Summary -->
    <SectionCard
      title="Actor Summary"
      description="Storage provider actors and deadline status"
      :icon="UsersIcon"
    >
      <ActorSummary />
    </SectionCard>
  </div>
</template>

<script setup lang="ts">
import {
  ChartBarIcon,
  ServerIcon,
  UsersIcon,
  ServerStackIcon,
  LinkIcon,
} from "@heroicons/vue/24/outline";

import ActorSummary from "./components/ActorSummary.vue";
import TaskCounts from "./components/TaskCounts.vue";
import StorageStats from "./components/StorageStats.vue";
import ChainConnectivity from "./components/ChainConnectivity.vue";
import ClusterMachines from "./components/ClusterMachines.vue";
import ClusterStats from "./components/ClusterStats.vue";
import SectionCard from "@/components/ui/SectionCard.vue";
</script>
