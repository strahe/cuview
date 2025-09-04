<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeftIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
} from "@heroicons/vue/24/outline";
import KPICard from "@/components/ui/KPICard.vue";
import SectionCard from "@/components/ui/SectionCard.vue";
import MachineStatusBadge from "./components/MachineStatusBadge.vue";

const router = useRouter();

// Different test scenarios for dynamic content
const testScenarios = {
  empty: { RunningTasks: [] },
  few: {
    RunningTasks: [
      {
        ID: 12345,
        Task: "SDR",
        Posted: "2024-01-15T08:25:00Z",
        PoRepSector: 1234,
        PoRepSectorSP: 1001,
        PoRepSectorMiner: "f01001",
      },
      {
        ID: 12346,
        Task: "PC1",
        Posted: "2024-01-15T09:15:00Z",
        PoRepSector: 1235,
        PoRepSectorSP: 1001,
        PoRepSectorMiner: "f01001",
      },
    ],
  },
  many: {
    RunningTasks: Array.from({ length: 25 }, (_, i) => ({
      ID: 12345 + i,
      Task: ["SDR", "PC1", "PC2", "C2"][i % 4],
      Posted: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
      PoRepSector: 1234 + i,
      PoRepSectorSP: 1001,
      PoRepSectorMiner: "f01001",
    })),
  },
};

// You can change this to test different scenarios: 'empty', 'few', 'many'
const currentScenario = "many";

// Mock data based on Curio RPC structure
const mockMachineData = ref({
  Info: {
    Name: "worker-01",
    Host: "192.168.1.100:2345",
    ID: 5,
    LastContact: "12s",
    CPU: 24,
    Memory: 68719476736, // 64GB in bytes
    GPU: 4,
    Layers: "seal,post",
    Unschedulable: false,
    RunningTasks: 8,
    Restarting: false,
  },
  Storage: [
    {
      ID: "store-001",
      Weight: 10,
      MaxStorage: 2199023255552, // 2TB
      CanSeal: false,
      CanStore: true,
      Groups: "main",
      AllowTo: "",
      AllowTypes: "unsealed,sealed,cache,update,update-cache",
      DenyTypes: "",
      Capacity: 2199023255552,
      Available: 329853931520, // ~15% available
      FSAvailable: 329853931520,
      Reserved: 0,
      Used: 1869169324032, // ~85% used
      AllowMiners: "",
      DenyMiners: "",
      LastHeartbeat: "2024-01-15T10:30:00Z",
      HeartbeatErr: "",
      UsedPercent: 85,
      ReservedPercent: 0,
    },
    {
      ID: "store-002",
      Weight: 10,
      MaxStorage: 4398046511104, // 4TB
      CanSeal: false,
      CanStore: true,
      Groups: "main",
      AllowTo: "",
      AllowTypes: "unsealed,sealed,cache,update,update-cache",
      DenyTypes: "",
      Capacity: 4398046511104,
      Available: 2419020169830, // ~55% available
      FSAvailable: 2419020169830,
      Reserved: 0,
      Used: 1979026341274, // ~45% used
      AllowMiners: "",
      DenyMiners: "",
      LastHeartbeat: "2024-01-15T10:29:45Z",
      HeartbeatErr: "",
      UsedPercent: 45,
      ReservedPercent: 0,
    },
    {
      ID: "seal-001",
      Weight: 15,
      MaxStorage: 1099511627776, // 1TB
      CanSeal: true,
      CanStore: false,
      Groups: "seal",
      AllowTo: "",
      AllowTypes: "cache,update-cache",
      DenyTypes: "sealed,unsealed",
      Capacity: 1099511627776,
      Available: 87961293414, // ~8% available
      FSAvailable: 87961293414,
      Reserved: 0,
      Used: 1011550334362, // ~92% used
      AllowMiners: "",
      DenyMiners: "",
      LastHeartbeat: "2024-01-15T10:30:15Z",
      HeartbeatErr: "",
      UsedPercent: 92,
      ReservedPercent: 0,
    },
    {
      ID: "cache-001",
      Weight: 5,
      MaxStorage: 536870912000, // 500GB
      CanSeal: true,
      CanStore: false,
      Groups: "cache",
      AllowTo: "",
      AllowTypes: "cache",
      DenyTypes: "sealed,unsealed",
      Capacity: 536870912000,
      Available: 472446926880, // ~88% available
      FSAvailable: 472446926880,
      Reserved: 0,
      Used: 64423985120, // ~12% used
      AllowMiners: "",
      DenyMiners: "",
      LastHeartbeat: "2024-01-15T10:30:30Z",
      HeartbeatErr: "",
      UsedPercent: 12,
      ReservedPercent: 0,
    },
  ],
  RunningTasks: testScenarios[currentScenario].RunningTasks,
  FinishedTasks: [
    {
      ID: 12344,
      Task: "C2",
      Posted: "2024-01-15T06:15:00Z",
      Start: "2024-01-15T06:16:00Z",
      Queued: "1m",
      Took: "1h 23m",
      Outcome: "success",
      Message: "Task completed successfully",
    },
    {
      ID: 12343,
      Task: "PC2",
      Posted: "2024-01-15T02:30:00Z",
      Start: "2024-01-15T02:32:00Z",
      Queued: "2m",
      Took: "3h 45m",
      Outcome: "success",
      Message: "Task completed successfully",
    },
    {
      ID: 12342,
      Task: "SDR",
      Posted: "2024-01-14T18:20:00Z",
      Start: "2024-01-14T18:25:00Z",
      Queued: "5m",
      Took: "8h 12m",
      Outcome: "failed",
      Message: "Insufficient disk space",
    },
    {
      ID: 12341,
      Task: "PC1",
      Posted: "2024-01-14T16:45:00Z",
      Start: "2024-01-14T16:47:00Z",
      Queued: "2m",
      Took: "2h 18m",
      Outcome: "success",
      Message: "Task completed successfully",
    },
    {
      ID: 12340,
      Task: "C2",
      Posted: "2024-01-14T14:10:00Z",
      Start: "2024-01-14T14:12:00Z",
      Queued: "2m",
      Took: "1h 15m",
      Outcome: "success",
      Message: "Task completed successfully",
    },
  ],
});

// Computed values for KPI cards
const cpuUsage = computed(() => {
  const used =
    mockMachineData.value.RunningTasks.filter((t) =>
      ["SDR", "PC1", "PC2"].includes(t.Task),
    ).length * 2;
  return Math.min((used / mockMachineData.value.Info.CPU) * 100, 100);
});

const memoryUsage = computed(() => {
  const totalGB = mockMachineData.value.Info.Memory / (1024 * 1024 * 1024);
  const usedGB = mockMachineData.value.Info.RunningTasks * 4; // Assume 4GB per task
  return {
    used: usedGB,
    total: Math.round(totalGB),
    percentage: Math.min((usedGB / totalGB) * 100, 100),
  };
});

const gpuUsage = computed(() => {
  const used = mockMachineData.value.RunningTasks.filter((t) =>
    ["SDR", "PC2"].includes(t.Task),
  ).length;
  return Math.min((used / mockMachineData.value.Info.GPU) * 100, 100);
});

const storageStats = computed(() => {
  const totalCapacity = mockMachineData.value.Storage.reduce(
    (sum, s) => sum + s.Capacity,
    0,
  );
  const totalUsed = mockMachineData.value.Storage.reduce(
    (sum, s) => sum + s.Used,
    0,
  );
  return {
    volumes: mockMachineData.value.Storage.length,
    used: totalUsed,
    total: totalCapacity,
    percentage: (totalUsed / totalCapacity) * 100,
  };
});

// Helper functions
const formatBytes = (bytes: number) => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

const formatDuration = (posted: string) => {
  const now = new Date();
  const postedDate = new Date(posted);
  const diffMs = now.getTime() - postedDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
};

const getTaskTypeColor = (taskType: string) => {
  const colors = {
    SDR: "badge-primary",
    PC1: "badge-info",
    PC2: "badge-warning",
    C2: "badge-success",
  };
  return colors[taskType as keyof typeof colors] || "badge-neutral";
};

const goBack = () => {
  router.push("/machines");
};
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button class="btn btn-ghost btn-sm gap-2" @click="goBack">
          <ArrowLeftIcon class="size-4" />
          Back to Machines
        </button>
        <div class="divider divider-horizontal"></div>
        <div>
          <h1 class="text-2xl font-bold">
            Machine: {{ mockMachineData.Info.Name }}
            <span class="text-base-content/60"
              >(ID: {{ mockMachineData.Info.ID }})</span
            >
          </h1>
          <p class="text-base-content/70 text-sm">
            Last Contact: {{ mockMachineData.Info.LastContact }} ago •
            {{ mockMachineData.Info.Host }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <MachineStatusBadge
          :unschedulable="mockMachineData.Info.Unschedulable"
          :since-contact="mockMachineData.Info.LastContact"
          :running-tasks="mockMachineData.Info.RunningTasks"
          :restarting="mockMachineData.Info.Restarting"
        />
        <div class="flex gap-2">
          <button
            v-if="mockMachineData.Info.Unschedulable"
            class="btn btn-success btn-sm gap-1"
          >
            <PlayIcon class="size-4" />
            Uncordon
          </button>
          <button v-else class="btn btn-warning btn-sm gap-1">
            <PauseIcon class="size-4" />
            Cordon
          </button>
          <button
            class="btn btn-info btn-sm gap-1"
            :disabled="!mockMachineData.Info.Unschedulable"
          >
            <ArrowPathIcon class="size-4" />
            Restart
          </button>
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <KPICard
        label="CPU Usage"
        :value="`${Math.round(cpuUsage)}%`"
        :subtitle="`${mockMachineData.Info.CPU} cores`"
        :icon="CpuChipIcon"
        icon-color="primary"
      />
      <KPICard
        label="Memory"
        :value="`${memoryUsage.used}/${memoryUsage.total}GB`"
        :subtitle="`${Math.round(memoryUsage.percentage)}% used`"
        :icon="ServerIcon"
        icon-color="info"
      />
      <KPICard
        label="GPU Usage"
        :value="`${Math.round(gpuUsage)}%`"
        :subtitle="`${mockMachineData.Info.GPU} units`"
        :icon="CpuChipIcon"
        icon-color="warning"
      />
      <KPICard
        label="Running Tasks"
        :value="mockMachineData.Info.RunningTasks"
        subtitle="Active"
        :icon="ClockIcon"
        icon-color="success"
      />
      <KPICard
        label="Storage"
        :value="storageStats.volumes"
        subtitle="Volumes"
        :icon="CircleStackIcon"
        icon-color="secondary"
      />
      <KPICard
        label="Uptime"
        value="7d 3h"
        subtitle="99.8%"
        :icon="ServerIcon"
        icon-color="accent"
      />
    </div>

    <!-- Main Content - Two Column Layout -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <!-- Left Column - Machine Info & Storage -->
      <div class="space-y-6">
        <!-- Machine Information -->
        <SectionCard
          title="Machine Information"
          description="Basic machine details and configuration"
          :icon="ServerIcon"
        >
          <div class="space-y-4">
            <div class="bg-base-200/50 rounded-lg p-4">
              <h4 class="mb-3 font-medium">Basic Information</h4>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="flex justify-between">
                  <span class="text-base-content/70">Name:</span>
                  <span class="font-medium">{{
                    mockMachineData.Info.Name
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">Address:</span>
                  <span class="font-mono text-sm">{{
                    mockMachineData.Info.Host
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">Layers:</span>
                  <span class="font-medium">{{
                    mockMachineData.Info.Layers
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">Tasks:</span>
                  <span class="font-medium">SDR,PC1,PC2,C2</span>
                </div>
              </div>
            </div>

            <div class="bg-base-200/50 rounded-lg p-4">
              <h4 class="mb-3 font-medium">Hardware Resources</h4>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-base-content/70">CPU:</span>
                  <span class="font-medium"
                    >{{ mockMachineData.Info.CPU }} cores (Intel Xeon)</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">Memory:</span>
                  <span class="font-medium"
                    >{{ memoryUsage.total }} GB DDR4</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">GPU:</span>
                  <span class="font-medium"
                    >{{ mockMachineData.Info.GPU }}x NVIDIA RTX 4090</span
                  >
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <!-- Storage Volumes -->
        <SectionCard
          title="Storage Volumes"
          description="Disk utilization and storage configuration"
          :icon="CircleStackIcon"
        >
          <div class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr class="border-base-300">
                  <th>Volume ID</th>
                  <th>Size</th>
                  <th>Usage</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="volume in mockMachineData.Storage"
                  :key="volume.ID"
                  class="border-base-300/50"
                >
                  <td class="font-mono text-sm">{{ volume.ID }}</td>
                  <td class="font-medium">
                    {{ formatBytes(volume.Capacity) }}
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium"
                        >{{ volume.UsedPercent }}%</span
                      >
                      <progress
                        class="progress w-20"
                        :class="{
                          'progress-success': volume.UsedPercent < 70,
                          'progress-warning':
                            volume.UsedPercent >= 70 && volume.UsedPercent < 90,
                          'progress-error': volume.UsedPercent >= 90,
                        }"
                        :value="volume.UsedPercent"
                        max="100"
                      ></progress>
                    </div>
                  </td>
                  <td>
                    <div class="badge badge-sm badge-outline">
                      {{ volume.CanSeal ? "Seal" : "Store" }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <!-- Right Column - Tasks & Activity -->
      <div class="space-y-6">
        <!-- Running Tasks -->
        <SectionCard
          title="Running Tasks"
          :description="`Currently executing tasks on this machine (${mockMachineData.RunningTasks.length})`"
          :icon="ClockIcon"
        >
          <!-- Empty State -->
          <div
            v-if="mockMachineData.RunningTasks.length === 0"
            class="py-12 text-center"
          >
            <div class="mb-4 text-4xl">💤</div>
            <div class="text-base-content/70 mb-2 text-lg font-medium">
              No Running Tasks
            </div>
            <div class="text-base-content/50 text-sm">
              This machine is currently idle
            </div>
          </div>

          <!-- Tasks List -->
          <div v-else>
            <!-- Quick Stats for Large Lists -->
            <div
              v-if="mockMachineData.RunningTasks.length > 3"
              class="mb-4 flex flex-wrap gap-2"
            >
              <div class="badge badge-outline badge-sm">
                {{
                  mockMachineData.RunningTasks.filter((t) => t.Task === "SDR")
                    .length
                }}
                SDR
              </div>
              <div class="badge badge-outline badge-sm">
                {{
                  mockMachineData.RunningTasks.filter((t) => t.Task === "PC1")
                    .length
                }}
                PC1
              </div>
              <div class="badge badge-outline badge-sm">
                {{
                  mockMachineData.RunningTasks.filter((t) => t.Task === "PC2")
                    .length
                }}
                PC2
              </div>
              <div class="badge badge-outline badge-sm">
                {{
                  mockMachineData.RunningTasks.filter((t) => t.Task === "C2")
                    .length
                }}
                C2
              </div>
            </div>

            <!-- Tasks Container with Dynamic Height -->
            <div
              class="border-base-300/30 space-y-2 overflow-y-auto rounded-lg border"
              :class="{
                'max-h-60': mockMachineData.RunningTasks.length > 5,
                'max-h-96': mockMachineData.RunningTasks.length > 10,
                'max-h-[500px]': mockMachineData.RunningTasks.length > 20,
              }"
            >
              <div
                v-for="(task, index) in mockMachineData.RunningTasks"
                :key="task.ID"
                class="bg-base-100 hover:bg-base-200/50 flex items-center justify-between p-3 transition-colors"
                :class="{
                  'border-base-300/30 border-b':
                    index < mockMachineData.RunningTasks.length - 1,
                }"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="badge badge-sm"
                    :class="getTaskTypeColor(task.Task)"
                  >
                    {{ task.Task }}
                  </div>
                  <div>
                    <div class="font-mono text-sm font-medium">
                      #{{ task.ID }}
                    </div>
                    <div class="text-base-content/60 text-xs">
                      {{
                        task.PoRepSector
                          ? `Sector ${task.PoRepSector}`
                          : "Processing"
                      }}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium">
                    {{ formatDuration(task.Posted) }}
                  </div>
                  <div class="text-base-content/60 text-xs">running</div>
                </div>
              </div>
            </div>

            <!-- Show All Button for Large Lists -->
            <div
              v-if="mockMachineData.RunningTasks.length > 20"
              class="mt-3 text-center"
            >
              <button class="btn btn-ghost btn-sm">
                View All {{ mockMachineData.RunningTasks.length }} Tasks →
              </button>
            </div>
          </div>
        </SectionCard>

        <!-- Recent Activity -->
        <SectionCard
          title="Recent Activity"
          :description="`Latest completed and failed tasks (${mockMachineData.FinishedTasks.length} total)`"
          :icon="ClockIcon"
        >
          <!-- Empty State -->
          <div
            v-if="mockMachineData.FinishedTasks.length === 0"
            class="py-12 text-center"
          >
            <div class="mb-4 text-4xl">📭</div>
            <div class="text-base-content/70 mb-2 text-lg font-medium">
              No Task History
            </div>
            <div class="text-base-content/50 text-sm">
              No completed tasks found on this machine
            </div>
          </div>

          <!-- Activity List -->
          <div v-else>
            <!-- Summary Stats -->
            <div
              v-if="mockMachineData.FinishedTasks.length > 0"
              class="mb-4 flex flex-wrap gap-2"
            >
              <div class="badge badge-success badge-outline badge-sm">
                {{
                  mockMachineData.FinishedTasks.filter(
                    (t) => t.Outcome === "success",
                  ).length
                }}
                Successful
              </div>
              <div class="badge badge-error badge-outline badge-sm">
                {{
                  mockMachineData.FinishedTasks.filter(
                    (t) => t.Outcome === "failed",
                  ).length
                }}
                Failed
              </div>
            </div>

            <!-- Recent Tasks (show up to 8) -->
            <div class="space-y-2">
              <div
                v-for="(task, index) in mockMachineData.FinishedTasks.slice(
                  0,
                  8,
                )"
                :key="task.ID"
                class="bg-base-100 hover:bg-base-200/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                :class="{
                  'border-base-300/30 border-b':
                    index <
                    Math.min(mockMachineData.FinishedTasks.length, 8) - 1,
                }"
              >
                <div class="flex items-center gap-3">
                  <div class="text-lg">
                    {{ task.Outcome === "success" ? "✅" : "❌" }}
                  </div>
                  <div>
                    <div class="font-mono text-sm font-medium">
                      Task #{{ task.ID }} ({{ task.Task }})
                    </div>
                    <div class="text-base-content/60 text-xs">
                      {{ task.Outcome === "success" ? "completed" : "failed" }}
                      {{ task.Outcome === "failed" ? `- ${task.Message}` : "" }}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium">{{ task.Took }}</div>
                  <div class="text-base-content/60 text-xs">
                    {{ new Date(task.Start).toLocaleDateString() }}
                  </div>
                </div>
              </div>
            </div>

            <!-- View All Button -->
            <div
              v-if="mockMachineData.FinishedTasks.length > 8"
              class="mt-4 text-center"
            >
              <button class="btn btn-ghost btn-sm">
                View All {{ mockMachineData.FinishedTasks.length }} Tasks
                History →
              </button>
            </div>
            <div
              v-else-if="mockMachineData.FinishedTasks.length > 0"
              class="mt-4 text-center"
            >
              <button class="btn btn-ghost btn-sm">View Full History →</button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>

    <!-- Task History & Performance (Expandable Section) -->
    <div class="mt-6">
      <SectionCard
        title="Task History & Performance"
        description="Complete task execution history and performance metrics"
        :icon="ClockIcon"
        collapsible
        :collapsed="true"
      >
        <div class="overflow-x-auto">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex gap-2">
              <select class="select select-bordered select-sm">
                <option value="">All Task Types</option>
                <option value="SDR">SDR</option>
                <option value="PC1">PC1</option>
                <option value="PC2">PC2</option>
                <option value="C2">C2</option>
              </select>
              <input
                type="text"
                placeholder="Search tasks..."
                class="input input-bordered input-sm"
              />
            </div>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-sm">Export</button>
              <button class="btn btn-primary btn-sm">Filter</button>
            </div>
          </div>

          <table class="table w-full">
            <thead>
              <tr class="border-base-300">
                <th>Task ID</th>
                <th>Type</th>
                <th>Sector</th>
                <th>Started</th>
                <th>Duration</th>
                <th>Result</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="task in mockMachineData.FinishedTasks"
                :key="task.ID"
                class="border-base-300/50 hover:bg-base-200/30"
              >
                <td class="font-mono text-sm">#{{ task.ID }}</td>
                <td>
                  <div
                    class="badge badge-sm"
                    :class="getTaskTypeColor(task.Task)"
                  >
                    {{ task.Task }}
                  </div>
                </td>
                <td class="font-mono text-sm">s-1233</td>
                <td class="text-sm">
                  {{ new Date(task.Start).toLocaleString() }}
                </td>
                <td class="font-medium">{{ task.Took }}</td>
                <td>
                  <div
                    class="badge badge-sm"
                    :class="
                      task.Outcome === 'success'
                        ? 'badge-success'
                        : 'badge-error'
                    "
                  >
                    {{ task.Outcome === "success" ? "✅" : "❌" }}
                  </div>
                </td>
                <td class="text-base-content/70 max-w-xs truncate text-sm">
                  {{ task.Message }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  </div>
</template>
