<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed } from "vue";
import DataSection from "@/components/ui/DataSection.vue";
import KPICard from "@/components/ui/KPICard.vue";
import Card from "@/components/ui/Card.vue";
import MachinesTable from "./components/MachinesTable.vue";
import { useMachinesData } from "./composables/useMachinesData";
import { useMachineFilters } from "./composables/useMachineFilters";

const { machines, loading, error, refresh } = useMachinesData();

const { filteredMachines } = useMachineFilters(machines);

const stats = computed(() => {
  if (!filteredMachines.value) return null;

  const total = filteredMachines.value.length;
  const online = filteredMachines.value.filter((m) => {
    const contactMatch = m.SinceContact.match(/(\d+)s/);
    const secondsSinceContact = contactMatch ? parseInt(contactMatch[1]) : 0;
    return secondsSinceContact <= 60 && !m.Unschedulable;
  }).length;

  const unschedulable = filteredMachines.value.filter(
    (m) => m.Unschedulable,
  ).length;
  const offline = total - online - unschedulable;

  const totalRunningTasks = filteredMachines.value.reduce(
    (sum, m) => sum + (m.RunningTasks || 0),
    0,
  );

  const totalCpu = filteredMachines.value.reduce((sum, m) => sum + m.Cpu, 0);
  const totalGpu = filteredMachines.value.reduce((sum, m) => sum + m.Gpu, 0);

  return {
    total,
    online,
    offline,
    unschedulable,
    totalRunningTasks,
    totalCpu,
    totalGpu,
  };
});

const hasData = computed(() =>
  Boolean(machines.value && machines.value.length > 0),
);
</script>

<template>
  <div class="p-6">
    <h1 class="mb-6 text-2xl font-bold">Cluster Machines</h1>

    <Card>
      <DataSection
        :loading="loading"
        :error="error"
        :has-data="hasData"
        :on-retry="refresh"
        error-title="Failed to Load Machines"
        empty-title="No Machines"
        empty-message="No cluster machines found"
        empty-icon="🖥️"
      >
        <!-- KPI Cards -->
        <div
          v-if="stats"
          class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7"
        >
          <KPICard
            label="Total Machines"
            :value="stats.total"
            :subtitle="`${stats.online} online`"
          />
          <KPICard
            label="Online"
            :value="stats.online"
            :class="stats.online > 0 ? 'bg-success/10' : ''"
          />
          <KPICard
            label="Offline"
            :value="stats.offline"
            :class="stats.offline > 0 ? 'bg-error/10' : ''"
          />
          <KPICard
            label="Unschedulable"
            :value="stats.unschedulable"
            :class="stats.unschedulable > 0 ? 'bg-warning/10' : ''"
          />
          <KPICard label="Running Tasks" :value="stats.totalRunningTasks" />
          <KPICard label="Total CPU" :value="stats.totalCpu" subtitle="cores" />
          <KPICard label="Total GPU" :value="stats.totalGpu" subtitle="units" />
        </div>

        <!-- Machines Table -->
        <MachinesTable
          :machines="filteredMachines || []"
          :loading="loading"
          :error="error"
          :on-refresh="refresh"
        />
      </DataSection>
    </Card>
  </div>
</template>
