<script setup lang="ts">
import { ref } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import type { ActorSummaryData, Deadline } from "@/types/actor";

const openTooltipIndex = ref<string>("");
const tooltipPosition = ref({ x: 0, y: 0 });

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

const toggleTooltip = (
  event: Event,
  actorAddress: string,
  deadlineIndex: number,
) => {
  const key = `${actorAddress}-${deadlineIndex}`;

  if (openTooltipIndex.value === key) {
    openTooltipIndex.value = "";
    return;
  }

  const target = event.target as HTMLElement;
  const rect = target.getBoundingClientRect();

  // Position tooltip above the element to avoid clipping
  tooltipPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 10,
  };

  openTooltipIndex.value = key;
};
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
    @click="openTooltipIndex = ''"
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
                <CopyButton :text="entry.Address" title="Copy address" />
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
              <div class="deadline-grid">
                <div
                  v-for="(deadline, index) in entry.Deadlines"
                  :key="`${entry.Address}-${index}`"
                  class="deadline-container"
                  @click.stop="
                    (event) => toggleTooltip(event, entry.Address, index)
                  "
                >
                  <div
                    :class="getDeadlineClass(deadline)"
                    class="deadline-square"
                    :title="`Deadline ${index + 1} - Click for details`"
                  ></div>

                  <Teleport to="body">
                    <div
                      v-if="openTooltipIndex === `${entry.Address}-${index}`"
                      class="deadline-tooltip"
                      :style="{
                        position: 'fixed',
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`,
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        pointerEvents: 'auto',
                      }"
                    >
                      <div class="deadline-tooltip-content">
                        <div class="deadline-tooltip-header">
                          Deadline {{ index + 1 }}
                          <span v-if="deadline.Current" class="text-info"
                            >(Current)</span
                          >
                        </div>

                        <div
                          v-if="deadline.Count"
                          class="deadline-tooltip-stats"
                        >
                          <div class="stat-row">
                            <span>Total:</span>
                            <span>{{ deadline.Count.Total }}</span>
                          </div>
                          <div class="stat-row">
                            <span>Active:</span>
                            <span>{{ deadline.Count.Active }}</span>
                          </div>
                          <div class="stat-row">
                            <span>Live:</span>
                            <span>{{ deadline.Count.Live }}</span>
                          </div>
                          <div v-if="deadline.Count.Fault > 0" class="stat-row">
                            <span>Fault:</span>
                            <span class="text-error">{{
                              deadline.Count.Fault
                            }}</span>
                          </div>
                          <div
                            v-if="deadline.Count.Recovering > 0"
                            class="stat-row"
                          >
                            <span>Recovering:</span>
                            <span class="text-warning">{{
                              deadline.Count.Recovering
                            }}</span>
                          </div>
                        </div>

                        <div v-else class="text-base-content/60">
                          No sector data
                        </div>
                      </div>
                    </div>
                  </Teleport>
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
            class="h-4 w-4 rounded-sm"
            style="background-color: deepskyblue"
          ></div>
          <span>Current</span>
        </div>
      </div>
    </div>
  </DataSection>
</template>

<style scoped>
/* Deadline grid layout */
.deadline-grid {
  display: grid;
  grid-template-columns: repeat(16, minmax(0, 1fr));
  gap: 0.25rem;
  width: fit-content;
}

.deadline-container {
  position: relative;
  cursor: pointer;
}

.deadline-square {
  position: relative;
  background-color: #4b5563;
  border: 1px solid #374151;
  min-width: 16px;
  min-height: 16px;
  width: 16px;
  height: 16px;
  border-radius: 0.125rem;
  transition: all 0.15s ease-in-out;
}

.deadline-square:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Deadline states */
.deadline-entry {
  position: relative;
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

/* For current deadlines with no other status, use blue background */
.deadline-entry.deadline-current:not(.deadline-proven):not(
    .deadline-partial-fault
  ):not(.deadline-faulty) {
  background-color: deepskyblue !important;
  border: 1px solid deepskyblue !important;
}

/* Simple tooltip */
.deadline-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
}

.deadline-tooltip-content {
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 160px;
  backdrop-filter: blur(8px);
}

.deadline-tooltip-header {
  font-weight: 600;
  margin-bottom: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid oklch(var(--b3));
}

.deadline-tooltip-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.125rem 0;
}

.stat-row span:first-child {
  color: oklch(var(--nc) / 0.7);
}

.stat-row span:last-child {
  font-weight: 500;
}

/* Responsive grid for smaller screens */
@media (max-width: 1024px) {
  .deadline-grid {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .deadline-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .deadline-square {
    min-width: 14px;
    min-height: 14px;
    width: 14px;
    height: 14px;
  }
}
</style>
