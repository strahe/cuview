<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex flex-wrap gap-4">
      <div class="form-control">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search sectors..."
          class="input input-bordered input-sm w-full max-w-xs"
        />
      </div>
      <div class="form-control">
        <select
          v-model="filters.status"
          class="select select-bordered select-sm w-full max-w-xs"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div class="form-control">
        <input
          v-model="filters.spFilter"
          type="text"
          placeholder="Storage Provider..."
          class="input input-bordered input-sm w-full max-w-xs"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="table-zebra table">
        <thead>
          <tr>
            <th>Miner</th>
            <th>Sector</th>
            <th>State</th>
            <th>Create Time</th>
            <th>PreCommit Ready</th>
            <th>Commit Ready</th>
            <th>Error</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="text-center">
            <td colspan="8">
              <div class="flex items-center justify-center gap-2 py-4">
                <span class="loading loading-spinner loading-sm"></span>
                Loading sectors...
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredSectors.length === 0">
            <td colspan="8" class="text-base-content/60 py-8 text-center">
              No sectors found
            </td>
          </tr>
          <tr
            v-for="sector in filteredSectors"
            v-else
            :key="`${sector.SpID}-${sector.SectorNumber}`"
            class="hover:bg-base-200 cursor-pointer"
            @click="showSectorDetails(sector)"
          >
            <td>
              <div class="font-mono text-sm">{{ sector.Address }}</div>
            </td>
            <td>
              <div class="font-bold">{{ sector.SectorNumber }}</div>
            </td>
            <td @click.stop>
              <div
                class="badge hover:badge-outline cursor-pointer transition-colors"
                :class="getStateBadgeClass(sector)"
                :title="
                  getActiveTasks(sector).length > 0
                    ? 'Click to view active task details'
                    : 'No active tasks'
                "
                @click="showActiveTaskDetails(sector)"
              >
                {{ getCurrentState(sector) }}
              </div>
            </td>
            <td>
              <div class="text-sm">
                {{ formatDateTime(sector.CreateTime) }}
              </div>
            </td>
            <td>
              <div v-if="sector.PreCommitReadyAt" class="text-sm">
                {{ formatDateTime(sector.PreCommitReadyAt) }}
              </div>
              <span v-else class="text-base-content/60">-</span>
            </td>
            <td>
              <div v-if="sector.CommitReadyAt" class="text-sm">
                {{ formatDateTime(sector.CommitReadyAt) }}
              </div>
              <span v-else class="text-base-content/60">-</span>
            </td>
            <td>
              <div v-if="sector.Failed && sector.FailedReason" class="max-w-xs">
                <div
                  class="text-error truncate text-sm"
                  :title="sector.FailedReason"
                >
                  {{ sector.FailedReason }}
                </div>
              </div>
              <span v-else class="text-base-content/60">-</span>
            </td>
            <td>
              <div class="flex gap-1">
                <button
                  v-if="sector.Failed"
                  class="btn btn-ghost btn-xs"
                  title="Restart sector"
                  @click="restartSector(sector)"
                >
                  <ArrowPathIcon class="h-3 w-3" />
                </button>
                <button
                  class="btn btn-ghost btn-xs"
                  title="View details"
                  @click="viewSectorDetails(sector)"
                >
                  <EyeIcon class="h-3 w-3" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="filteredSectors.length > 0"
      class="flex items-center justify-between"
    >
      <div class="text-base-content/60 text-sm">
        Showing {{ filteredSectors.length }} of
        {{ sectorsData?.length || 0 }} sectors
      </div>
    </div>

    <!-- Active Task Details Modal -->
    <dialog id="active-task-modal" class="modal">
      <div class="modal-box max-w-2xl">
        <h3 class="mb-4 text-lg font-bold">
          Active Task Details - SP{{ selectedSector?.SpID }} Sector
          {{ selectedSector?.SectorNumber }}
        </h3>

        <div v-if="selectedSector" class="space-y-4">
          <div
            v-if="getActiveTasks(selectedSector).length > 0"
            class="card bg-base-200"
          >
            <div class="card-body compact">
              <h4 class="card-title text-base">Currently Running Tasks</h4>
              <div class="space-y-2">
                <div
                  v-for="task in getActiveTasks(selectedSector)"
                  :key="task"
                  class="bg-info/20 flex items-center justify-between rounded p-3"
                >
                  <div class="flex items-center gap-2">
                    <span class="badge badge-info">{{ task }}</span>
                    <span class="font-medium">{{ task }} Task</span>
                  </div>
                  <div class="text-sm opacity-70">Status: Running</div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="card bg-base-200">
            <div class="card-body compact">
              <p class="text-base-content/60 text-center">
                No active tasks currently running
              </p>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn">Close</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    <!-- Sector Details Modal -->
    <dialog id="sector-details-modal" class="modal">
      <div class="modal-box max-w-4xl">
        <h3 class="mb-4 text-lg font-bold">
          Sector Details - SP{{ selectedSector?.SpID }} Sector
          {{ selectedSector?.SectorNumber }}
        </h3>

        <div v-if="selectedSector" class="space-y-4">
          <!-- Current State -->
          <div class="card bg-base-200">
            <div class="card-body compact">
              <h4 class="card-title text-base">Current State</h4>
              <div class="flex items-center gap-2">
                <div class="badge" :class="getStateBadgeClass(selectedSector)">
                  {{ getCurrentState(selectedSector) }}
                </div>
                <span v-if="selectedSector.Failed" class="text-error text-sm">
                  {{ selectedSector.FailedReason }}
                </span>
              </div>
            </div>
          </div>

          <!-- Task Progress -->
          <div class="card bg-base-200">
            <div class="card-body compact">
              <h4 class="card-title text-base">Task Progress</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div
                  v-for="stage in getTaskProgress(selectedSector)"
                  :key="stage.name"
                  class="flex items-center justify-between rounded p-2"
                  :class="
                    stage.status === 'completed'
                      ? 'bg-success/20'
                      : stage.status === 'active'
                        ? 'bg-info/20'
                        : stage.status === 'failed'
                          ? 'bg-error/20'
                          : 'bg-base-300'
                  "
                >
                  <span>{{ stage.name }}</span>
                  <div class="flex items-center gap-1">
                    <span
                      class="badge badge-xs"
                      :class="
                        stage.status === 'completed'
                          ? 'badge-success'
                          : stage.status === 'active'
                            ? 'badge-info'
                            : stage.status === 'failed'
                              ? 'badge-error'
                              : 'badge-ghost'
                      "
                    >
                      {{ stage.status }}
                    </span>
                    <span v-if="stage.taskId" class="text-xs opacity-60">
                      T:{{ stage.taskId }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Timestamps -->
          <div class="card bg-base-200">
            <div class="card-body compact">
              <h4 class="card-title text-base">Timestamps</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium">Created:</span>
                  <div class="text-base-content/70">
                    {{ formatDateTime(selectedSector.CreateTime) }}
                  </div>
                </div>
                <div v-if="selectedSector.PreCommitReadyAt">
                  <span class="font-medium">PreCommit Ready:</span>
                  <div class="text-base-content/70">
                    {{ formatDateTime(selectedSector.PreCommitReadyAt) }}
                  </div>
                </div>
                <div v-if="selectedSector.CommitReadyAt">
                  <span class="font-medium">Commit Ready:</span>
                  <div class="text-base-content/70">
                    {{ formatDateTime(selectedSector.CommitReadyAt) }}
                  </div>
                </div>
                <div v-if="selectedSector.SeedEpoch">
                  <span class="font-medium">Seed Epoch:</span>
                  <div class="text-base-content/70">
                    {{ selectedSector.SeedEpoch }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Chain Status -->
          <div class="card bg-base-200">
            <div class="card-body compact">
              <h4 class="card-title text-base">Chain Status</h4>
              <div class="flex flex-wrap gap-2">
                <div
                  class="badge"
                  :class="
                    selectedSector.ChainAlloc ? 'badge-success' : 'badge-ghost'
                  "
                >
                  {{
                    selectedSector.ChainAlloc ? "Allocated" : "Not Allocated"
                  }}
                </div>
                <div
                  class="badge"
                  :class="
                    selectedSector.ChainSector ? 'badge-success' : 'badge-ghost'
                  "
                >
                  {{ selectedSector.ChainSector ? "On Chain" : "Not On Chain" }}
                </div>
                <div
                  class="badge"
                  :class="
                    selectedSector.ChainActive ? 'badge-success' : 'badge-ghost'
                  "
                >
                  {{ selectedSector.ChainActive ? "Active" : "Inactive" }}
                </div>
                <div
                  v-if="selectedSector.ChainUnproven"
                  class="badge badge-warning"
                >
                  Unproven
                </div>
                <div
                  v-if="selectedSector.ChainFaulty"
                  class="badge badge-error"
                >
                  Faulty
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn">Close</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ArrowPathIcon, EyeIcon } from "@heroicons/vue/24/outline";
import type { SectorListEntry, PipelineFilters } from "@/types/pipeline";
import { formatDateTime } from "@/utils/format";
import { useCachedQuery } from "@/composables/useCachedQuery";

interface Emits {
  (e: "refresh"): void;
}

defineEmits<Emits>();

const { data: sectorsData, loading } = useCachedQuery<SectorListEntry[]>(
  "PipelinePorepSectors",
  [],
  {
    pollingInterval: 30000,
  },
);

const selectedSector = ref<SectorListEntry | null>(null);

const filters = ref<PipelineFilters>({
  search: "",
  status: "all",
  spFilter: "",
  stageFilter: "",
});

const filteredSectors = computed(() => {
  const sectors = sectorsData.value || [];
  let result = sectors;

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(
      (sector) =>
        sector.SectorNumber.toString().includes(search) ||
        sector.Address.toLowerCase().includes(search) ||
        getCurrentState(sector).toLowerCase().includes(search),
    );
  }

  if (filters.value.status !== "all") {
    result = result.filter(
      (sector) =>
        getCurrentState(sector).toLowerCase() === filters.value.status,
    );
  }

  if (filters.value.spFilter) {
    const spFilter = filters.value.spFilter.toLowerCase();
    result = result.filter((sector) =>
      sector.Address.toLowerCase().includes(spFilter),
    );
  }

  return result;
});

const getCurrentState = (sector: SectorListEntry): string => {
  if (sector.Failed) return "Failed";
  if (sector.AfterCommitMsgSuccess) return "Completed";

  // Determine current stage based on pipeline progress
  if (!sector.AfterSDR) return "SDR";
  if (!sector.AfterTreeD) return "TreeD";
  if (!sector.AfterTreeC) return "TreeC";
  if (!sector.AfterTreeR) return "TreeR";
  if (!sector.AfterSynthetic) return "Synthetic";
  if (!sector.AfterPrecommitMsg) return "PreCommit";
  if (!sector.AfterSeed) return "WaitSeed";
  if (!sector.AfterPoRep) return "PoRep";
  if (!sector.AfterFinalize) return "Finalize";
  if (!sector.AfterMoveStorage) return "MoveStorage";
  if (!sector.AfterCommitMsg) return "CommitMsg";

  return "Unknown";
};

const getActiveTasks = (sector: SectorListEntry): string[] => {
  const tasks: string[] = [];

  if (sector.StartedSDR && !sector.AfterSDR) tasks.push("SDR");
  if (sector.StartedTreeD && !sector.AfterTreeD) tasks.push("TreeD");
  if (sector.StartedTreeRC && !sector.AfterTreeC) tasks.push("TreeC");
  if (sector.StartedSynthetic && !sector.AfterSynthetic)
    tasks.push("Synthetic");
  if (sector.StartedPrecommitMsg && !sector.AfterPrecommitMsg)
    tasks.push("PreCommit");
  if (sector.StartedPoRep && !sector.AfterPoRep) tasks.push("PoRep");
  if (sector.StartedFinalize && !sector.AfterFinalize) tasks.push("Finalize");
  if (sector.StartedMoveStorage && !sector.AfterMoveStorage)
    tasks.push("MoveStorage");
  if (sector.StartedCommitMsg && !sector.AfterCommitMsg)
    tasks.push("CommitMsg");

  return tasks;
};

const getStateBadgeClass = (sector: SectorListEntry) => {
  const state = getCurrentState(sector).toLowerCase();
  switch (state) {
    case "completed":
      return "badge-success";
    case "failed":
      return "badge-error";
    case "waitseed":
      return "badge-warning";
    case "sdr":
    case "treed":
    case "treec":
    case "treer":
    case "synthetic":
    case "precommit":
    case "porep":
    case "finalize":
    case "movestorage":
    case "commitmsg":
      return "badge-info";
    default:
      return "badge-ghost";
  }
};

const restartSector = (sector: SectorListEntry) => {
  console.log("Restart sector:", sector);
};

const viewSectorDetails = (sector: SectorListEntry) => {
  console.log("View sector details:", sector);
};

const showActiveTaskDetails = (sector: SectorListEntry) => {
  selectedSector.value = sector;
  const modal = document.getElementById(
    "active-task-modal",
  ) as HTMLDialogElement;
  modal?.showModal();
};

const showSectorDetails = (sector: SectorListEntry) => {
  selectedSector.value = sector;
  const modal = document.getElementById(
    "sector-details-modal",
  ) as HTMLDialogElement;
  modal?.showModal();
};

const getTaskProgress = (sector: SectorListEntry) => {
  const tasks = [
    {
      name: "SDR",
      status: sector.Failed
        ? "failed"
        : sector.AfterSDR
          ? "completed"
          : sector.StartedSDR
            ? "active"
            : "pending",
      taskId: sector.TaskSDR,
    },
    {
      name: "TreeD",
      status: sector.Failed
        ? "failed"
        : sector.AfterTreeD
          ? "completed"
          : sector.StartedTreeD
            ? "active"
            : "pending",
      taskId: sector.TaskTreeD,
    },
    {
      name: "TreeC",
      status: sector.Failed
        ? "failed"
        : sector.AfterTreeC
          ? "completed"
          : sector.StartedTreeRC
            ? "active"
            : "pending",
      taskId: sector.TaskTreeC,
    },
    {
      name: "TreeR",
      status: sector.Failed
        ? "failed"
        : sector.AfterTreeR
          ? "completed"
          : sector.StartedTreeRC
            ? "active"
            : "pending",
      taskId: sector.TaskTreeR,
    },
    {
      name: "Synthetic",
      status: sector.Failed
        ? "failed"
        : sector.AfterSynthetic
          ? "completed"
          : sector.StartedSynthetic
            ? "active"
            : "pending",
      taskId: sector.TaskSynthetic,
    },
    {
      name: "PreCommit",
      status: sector.Failed
        ? "failed"
        : sector.AfterPrecommitMsg
          ? "completed"
          : sector.StartedPrecommitMsg
            ? "active"
            : "pending",
      taskId: sector.TaskPrecommitMsg,
    },
    {
      name: "PoRep",
      status: sector.Failed
        ? "failed"
        : sector.AfterPoRep
          ? "completed"
          : sector.StartedPoRep
            ? "active"
            : "pending",
      taskId: sector.TaskPoRep,
    },
    {
      name: "Finalize",
      status: sector.Failed
        ? "failed"
        : sector.AfterFinalize
          ? "completed"
          : sector.StartedFinalize
            ? "active"
            : "pending",
      taskId: sector.TaskFinalize,
    },
    {
      name: "MoveStorage",
      status: sector.Failed
        ? "failed"
        : sector.AfterMoveStorage
          ? "completed"
          : sector.StartedMoveStorage
            ? "active"
            : "pending",
      taskId: sector.TaskMoveStorage,
    },
    {
      name: "CommitMsg",
      status: sector.Failed
        ? "failed"
        : sector.AfterCommitMsg
          ? "completed"
          : sector.StartedCommitMsg
            ? "active"
            : "pending",
      taskId: sector.TaskCommitMsg,
    },
  ];

  return tasks;
};
</script>
