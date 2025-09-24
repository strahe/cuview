<script setup lang="ts">
import { ref } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { getDeadlineSquareClasses } from "@/utils/ui";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import type { ActorSummaryData } from "@/types/actor";

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

const showTooltip = (
  event: MouseEvent,
  actorAddress: string,
  deadlineIndex: number,
) => {
  const key = `${actorAddress}-${deadlineIndex}`;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();

  // Position tooltip to the right with some offset
  tooltipPosition.value = {
    x: rect.right + 12,
    y: rect.top - 8,
  };

  openTooltipIndex.value = key;
};

const hideTooltip = () => {
  openTooltipIndex.value = "";
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
                  @mouseenter="
                    (event) => showTooltip(event, entry.Address, index)
                  "
                  @mouseleave="hideTooltip"
                >
                  <div :class="getDeadlineSquareClasses(deadline)"></div>

                  <Teleport to="body">
                    <div
                      v-if="openTooltipIndex === `${entry.Address}-${index}`"
                      class="deadline-tooltip"
                      :style="{
                        position: 'fixed',
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`,
                        zIndex: 1000,
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
          <div class="bg-info h-4 w-4 rounded-sm"></div>
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px;
}

.deadline-square {
  position: relative;
  min-width: 16px;
  min-height: 16px;
  width: 16px;
  height: 16px;
}

.deadline-container:hover .deadline-square {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

/* Deadline states handled by utility function */

/* Tooltip styling */
.deadline-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  animation: tooltipFadeIn 0.2s ease-out;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
