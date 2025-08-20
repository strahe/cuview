<script setup lang="ts">
import { ref, computed } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { DocumentDuplicateIcon } from "@heroicons/vue/24/outline";
import DataTable from "@/components/ui/DataTable.vue";
import type { ActorSummaryData, Deadline } from "@/types/actor";

const openTooltipIndex = ref<string>("");

const {
  data: actors,
  loading,
  error,
  hasData,
} = useCachedQuery<ActorSummaryData[]>("ActorSummary", [], {
  pollingInterval: 30000,
});

const isInitialLoading = computed(() => loading.value && !hasData.value);

const getDeadlineClass = (deadline: Deadline): string => {
  const classes = ["deadline-entry"];

  if (deadline.Current) classes.push("deadline-current");
  if (deadline.Proven) classes.push("deadline-proven");
  if (deadline.PartFaulty) classes.push("deadline-partial-fault");
  if (deadline.Faulty) classes.push("deadline-faulty");

  return classes.join(" ");
};

const toggleTooltip = (actorAddress: string, deadlineIndex: number) => {
  const key = `${actorAddress}-${deadlineIndex}`;
  openTooltipIndex.value = openTooltipIndex.value === key ? "" : key;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log("Address copied to clipboard");
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};
</script>

<template>
  <div class="space-y-4">
    <DataTable>
      <thead>
        <tr>
          <th>Address</th>
          <th>Source Layer</th>
          <th>QaP</th>
          <th>Deadlines</th>
          <th>Balance</th>
          <th>Available</th>
          <th>Wins (1d/7d/30d)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in actors" :key="entry.Address">
          <td>
            <div class="flex items-center gap-2">
              <span class="font-mono text-sm">{{ entry.Address }}</span>
              <button
                class="btn btn-ghost btn-xs"
                title="Copy address"
                @click="copyToClipboard(entry.Address)"
              >
                <DocumentDuplicateIcon class="size-4" />
              </button>
            </div>
          </td>

          <td>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="layer in entry.CLayers"
                :key="layer"
                class="badge badge-outline badge-sm"
              >
                {{ layer }}
              </span>
            </div>
          </td>

          <td class="font-medium">{{ entry.QualityAdjustedPower }}</td>

          <td>
            <div class="grid w-fit grid-cols-16 gap-1">
              <div
                v-for="(deadline, index) in entry.Deadlines"
                :key="index"
                class="relative"
              >
                <div
                  :class="getDeadlineClass(deadline)"
                  class="h-4 w-4 cursor-pointer rounded-sm transition-transform hover:scale-110"
                  @click="toggleTooltip(entry.Address, index)"
                ></div>

                <!-- Tooltip -->
                <div
                  v-if="openTooltipIndex === `${entry.Address}-${index}`"
                  class="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform"
                >
                  <div
                    class="bg-neutral text-neutral-content rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg"
                  >
                    <div v-if="deadline.Count" class="space-y-1">
                      <div>Total: {{ deadline.Count.Total }}</div>
                      <div>Active: {{ deadline.Count.Active }}</div>
                      <div>Live: {{ deadline.Count.Live }}</div>
                      <div>Fault: {{ deadline.Count.Fault }}</div>
                      <div>Recovering: {{ deadline.Count.Recovering }}</div>
                    </div>
                    <div v-else>No Count Info</div>

                    <!-- Arrow -->
                    <div
                      class="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-t-4 border-r-4 border-l-4 border-transparent"
                      style="border-top-color: oklch(var(--n))"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </td>

          <td class="font-medium">{{ entry.ActorBalance }}</td>
          <td class="font-medium">{{ entry.ActorAvailable }}</td>

          <td>
            <div class="flex items-center gap-1 text-sm">
              <span class="badge badge-success badge-sm">{{ entry.Win1 }}</span>
              <span>/</span>
              <span class="badge badge-primary badge-sm">{{ entry.Win7 }}</span>
              <span>/</span>
              <span class="badge badge-secondary badge-sm">{{
                entry.Win30
              }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </DataTable>

    <div v-if="isInitialLoading" class="text-base-content/60 py-8 text-center">
      <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
      Loading actor summary...
    </div>

    <div v-else-if="error" class="text-error py-8 text-center">
      <div class="mb-2 text-lg">🎭 Actor Error</div>
      <div class="text-sm">{{ error.message }}</div>
    </div>

    <div
      v-else-if="!actors || (actors.length === 0 && !loading)"
      class="text-base-content/60 py-8 text-center"
    >
      <div class="mb-2 text-4xl">🎭</div>
      <div>No actors available</div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap gap-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="bg-success h-4 w-4 rounded-sm"></div>
        <span>Proven</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="bg-warning h-4 w-4 rounded-sm"></div>
        <span>Partially Faulty</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="bg-error h-4 w-4 rounded-sm"></div>
        <span>Faulty</span>
      </div>
      <div class="flex items-center gap-2">
        <div
          class="bg-neutral border-neutral-content h-4 w-4 rounded-sm border"
          style="border-bottom: 3px solid oklch(var(--p))"
        ></div>
        <span>Current</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.deadline-entry {
  position: relative;
  background-color: oklch(var(--n));
  border: 1px solid oklch(var(--nc));
}

.deadline-current {
  border-bottom: 3px solid oklch(var(--p));
}

.deadline-proven {
  background-color: oklch(var(--su)) !important;
  border: 1px solid oklch(var(--su)) !important;
}

.deadline-partial-fault {
  background-color: oklch(var(--wa)) !important;
  border: 1px solid oklch(var(--wa)) !important;
}

.deadline-faulty {
  background-color: oklch(var(--er)) !important;
  border: 1px solid oklch(var(--er)) !important;
}

.grid-cols-16 {
  grid-template-columns: repeat(16, minmax(0, 1fr));
}
</style>
