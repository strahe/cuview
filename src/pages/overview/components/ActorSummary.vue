<script setup lang="ts">
import { ref } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";
import { DocumentDuplicateIcon } from "@heroicons/vue/24/outline";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import type { ActorSummaryData, Deadline } from "@/types/actor";

const openTooltipIndex = ref<string>("");

const {
  data: actors,
  loading,
  error,
  hasData,
  refresh,
} = useCachedQuery<ActorSummaryData[]>("ActorSummary", [], {
  pollingInterval: 30000,
});

const getDeadlineClass = (deadline: Deadline): string => {
  const classes = ["deadline-entry"];

  if (deadline.Count) {
    const { Fault, Recovering, Live, Active } = deadline.Count;

    if (Fault > 0 && Recovering === 0) {
      classes.push("deadline-faulty");
    } else if (Fault > 0 || Recovering > 0) {
      classes.push("deadline-partial-fault");
    } else if (Live > 0 || Active > 0) {
      classes.push("deadline-proven");
    }
  }

  if (deadline.Proven) classes.push("deadline-proven");
  if (deadline.PartFaulty) classes.push("deadline-partial-fault");
  if (deadline.Faulty) classes.push("deadline-faulty");
  if (deadline.Current) classes.push("deadline-current");

  return classes.join(" ");
};

const toggleTooltip = (actorAddress: string, deadlineIndex: number) => {
  const key = `${actorAddress}-${deadlineIndex}`;
  openTooltipIndex.value = openTooltipIndex.value === key ? "" : key;
};

const { copy: copyAddress } = useCopyToClipboard();
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData"
    :on-retry="refresh"
    error-title="Actor Data Error"
    empty-icon="🎭"
    empty-message="No actors available"
  >
    <template #loading>Loading actor summary...</template>

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
                  @click="copyAddress(entry.Address)"
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
                <span class="text-base-content/70 font-medium">{{
                  entry.Win1
                }}</span>
                <span class="text-base-content/60">/</span>
                <span class="text-base-content/70 font-medium">{{
                  entry.Win7
                }}</span>
                <span class="text-base-content/60">/</span>
                <span class="text-base-content/70 font-medium">{{
                  entry.Win30
                }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </DataTable>

      <div class="flex flex-wrap gap-4 text-sm">
        <div class="flex items-center gap-2">
          <div
            class="h-4 w-4 rounded-sm"
            style="background-color: #10b981"
          ></div>
          <span>Proven</span>
        </div>
        <div class="flex items-center gap-2">
          <div
            class="h-4 w-4 rounded-sm"
            style="background-color: #f59e0b"
          ></div>
          <span>Partially Faulty</span>
        </div>
        <div class="flex items-center gap-2">
          <div
            class="h-4 w-4 rounded-sm"
            style="background-color: #ef4444"
          ></div>
          <span>Faulty</span>
        </div>
        <div class="flex items-center gap-2">
          <div
            class="w-4 rounded-sm border"
            style="
              background-color: oklch(var(--n));
              border: 1px solid oklch(var(--nc));
              border-bottom: 3px solid deepskyblue;
              height: 13px;
            "
          ></div>
          <span>Current</span>
        </div>
      </div>
    </div>
  </DataSection>
</template>

<style scoped>
.deadline-entry {
  position: relative;
  background-color: #6b7280;
  border: 1px solid #4b5563;
  min-width: 16px;
  min-height: 16px;
}

.deadline-proven {
  background-color: #10b981 !important;
  border: 1px solid #10b981 !important;
}

.deadline-partial-fault {
  background-color: #f59e0b !important;
  border: 1px solid #f59e0b !important;
}

.deadline-faulty {
  background-color: #ef4444 !important;
  border: 1px solid #ef4444 !important;
}

.deadline-current {
  border-bottom: 3px solid deepskyblue !important;
  height: 13px !important;
}

/* For current deadlines with no other status, use neutral background */
.deadline-entry.deadline-current:not(.deadline-proven):not(
    .deadline-partial-fault
  ):not(.deadline-faulty) {
  background-color: oklch(var(--n)) !important;
  border: 1px solid oklch(var(--nc)) !important;
}

.grid-cols-16 {
  grid-template-columns: repeat(16, minmax(0, 1fr));
}
</style>
