<script setup lang="ts">
import { ref } from "vue";
import { getDeadlineSquareClasses } from "@/utils/ui";

interface DeadlineItem {
  Proven?: boolean;
  PartFaulty?: boolean;
  Faulty?: boolean;
  Current?: boolean;
  Count?: {
    Total?: number;
    Active?: number;
    Live?: number;
    Fault?: number;
    Recovering?: number;
  };
}

interface Props {
  deadlines: DeadlineItem[];
  entityId: string;
}

const props = defineProps<Props>();

const openTooltipIndex = ref<string>("");
const tooltipPosition = ref({ x: 0, y: 0 });

const showTooltip = (event: MouseEvent, deadlineIndex: number) => {
  const key = `${props.entityId}-${deadlineIndex}`;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();

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
  <div class="deadline-grid">
    <div
      v-for="(deadline, index) in deadlines"
      :key="`${entityId}-${index}`"
      class="group relative flex cursor-pointer items-center justify-center p-px"
      @mouseenter="(event) => showTooltip(event, index)"
      @mouseleave="hideTooltip"
    >
      <div
        :class="['deadline-square', getDeadlineSquareClasses(deadline)]"
      ></div>

      <Teleport to="body">
        <div
          v-if="openTooltipIndex === `${entityId}-${index}`"
          class="deadline-tooltip pointer-events-none fixed z-50"
          :style="{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }"
        >
          <div
            class="bg-base-300/90 text-base-content border-base-content/10 min-w-40 rounded-lg border p-3 text-xs shadow-lg backdrop-blur-md"
          >
            <div class="border-base-content/20 mb-2 border-b pb-1 font-medium">
              Deadline {{ index + 1 }}
              <span v-if="deadline.Current" class="text-info ml-1"
                >(Current)</span
              >
            </div>

            <div v-if="deadline.Count" class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-base-content/70">Total:</span>
                <span class="font-medium">{{ deadline.Count.Total }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-base-content/70">Active:</span>
                <span class="font-medium">{{ deadline.Count.Active }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-base-content/70">Live:</span>
                <span class="font-medium">{{ deadline.Count.Live }}</span>
              </div>
              <div
                v-if="deadline.Count.Fault && deadline.Count.Fault > 0"
                class="flex items-center justify-between"
              >
                <span class="text-base-content/70">Fault:</span>
                <span class="text-error font-medium">{{
                  deadline.Count.Fault
                }}</span>
              </div>
              <div
                v-if="
                  deadline.Count.Recovering && deadline.Count.Recovering > 0
                "
                class="flex items-center justify-between"
              >
                <span class="text-base-content/70">Recovering:</span>
                <span class="text-warning font-medium">{{
                  deadline.Count.Recovering
                }}</span>
              </div>
            </div>

            <div v-else class="text-base-content/60">No sector data</div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.deadline-grid {
  display: grid;
  grid-template-columns: repeat(16, minmax(0, 1fr));
  gap: 0.25rem;
  width: fit-content;
}

.deadline-square {
  position: relative;
  min-width: 16px;
  min-height: 16px;
  width: 16px;
  height: 16px;
  transition: box-shadow 0.2s;
}

.group:hover .deadline-square {
  box-shadow: 0 0 0 2px hsl(var(--p) / 0.5);
}

.deadline-tooltip {
  animation: tooltipFadeIn 0.2s ease-out;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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
