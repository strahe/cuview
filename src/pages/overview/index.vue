<route>
{
  "meta": {
    "title": "Dashboard"
  }
}
</route>

<template>
  <div class="space-y-6 p-6">
    <DashboardHero
      :metrics="metrics"
      :status="status"
      :last-updated-label="lastUpdatedLabel"
      :formatted-task-success-rate="formattedTaskSuccessRate"
      :machine-health-label="machineHealthLabel"
      :running-tasks-label="runningTasksLabel"
      :loading="loading"
      :loading-skeleton="loadingSkeleton"
      :hero-snapshot="heroSnapshot"
      :on-refresh="handleRefresh"
    />

    <div class="grid gap-6 xl:grid-cols-2">
      <SectionCard
        title="Chain Connectivity"
        tooltip="Monitor blockchain RPC connections and sync status"
        :icon="LinkIcon"
      >
        <ChainConnectivity />
      </SectionCard>

      <SectionCard
        title="Storage Usage"
        tooltip="View disk utilization across storage types"
        :icon="ServerStackIcon"
      >
        <StorageStats />
      </SectionCard>

      <SectionCard
        title="Cluster Machines"
        tooltip="Monitor hardware status and task scheduling across the cluster"
        :icon="ServerIcon"
        class="xl:col-span-2"
      >
        <ClusterMachines />
      </SectionCard>

      <SectionCard
        title="Actor Summary"
        tooltip="View storage provider actors and deadline status"
        :icon="UsersIcon"
        class="xl:col-span-2"
      >
        <ActorSummary />
      </SectionCard>

      <SectionCard
        title="Task Statistics"
        tooltip="View Harmony task success rates and status"
        :icon="ChartBarIcon"
      >
        <TaskCounts />
      </SectionCard>

      <SectionCard
        title="Recent Tasks"
        tooltip="Live completions from Harmony workers"
        :icon="BoltIcon"
      >
        <DashboardRecentTasks
          :items="recentTasks"
          :loading="recentTasksLoading"
          :error="recentTasksError"
        />
      </SectionCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BoltIcon,
  ChartBarIcon,
  LinkIcon,
  ServerIcon,
  ServerStackIcon,
  UsersIcon,
} from "@heroicons/vue/24/outline";

import ActorSummary from "./components/ActorSummary.vue";
import TaskCounts from "./components/TaskCounts.vue";
import StorageStats from "./components/StorageStats.vue";
import ChainConnectivity from "./components/ChainConnectivity.vue";
import ClusterMachines from "./components/ClusterMachines.vue";
import DashboardHero from "./components/DashboardHero.vue";
import DashboardRecentTasks from "./components/DashboardRecentTasks.vue";
import { useDashboardSummary } from "./composables/useDashboardSummary";
import SectionCard from "@/components/ui/SectionCard.vue";

const {
  loading,
  metrics,
  status,
  recentTasks,
  lastUpdatedLabel,
  formattedTaskSuccessRate,
  machineHealthLabel,
  runningTasksLabel,
  loadingSkeleton,
  recentTasksLoading,
  recentTasksError,
  heroSnapshot,
  refresh,
} = useDashboardSummary();

const handleRefresh = async () => {
  await refresh();
};
</script>
