<template>
  <div class="p-6 space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Curio Cluster Overview
        </h1>
        <p class="text-base-content/70 mt-1">Real-time monitoring and management for your Curio cluster</p>
      </div>
    </div>

    <!-- Chain Connectivity -->
    <SectionCard 
      title="Chain Connectivity"
      description="Blockchain RPC connections and sync status"
      :icon="LinkIcon"
    >
      <ChainConnectivity />
    </SectionCard>

    <!-- Cluster Machines -->
    <SectionCard 
      title="Cluster Machines"
      description="Hardware status and task scheduling"
      :icon="ServerIcon"
    >
      <ClusterMachines />
    </SectionCard>

    <!-- Storage and Task Stats -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
        title="Task Statistics (24h)"
        description="Success and failure rates for harmony tasks"
        :icon="ChartBarIcon"
      >
        <TaskCounts />
      </SectionCard>
    </div>

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
  LinkIcon
} from '@heroicons/vue/24/outline'

import ActorSummary from './overview/components/ActorSummary.vue'
import TaskCounts from './overview/components/TaskCounts.vue'
import StorageStats from './overview/components/StorageStats.vue'
import ChainConnectivity from './overview/components/ChainConnectivity.vue'
import ClusterMachines from './overview/components/ClusterMachines.vue'
import SectionCard from '@/components/ui/SectionCard.vue'
</script>