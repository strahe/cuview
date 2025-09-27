<script setup lang="ts">
import { computed } from "vue";
import { ExclamationTriangleIcon, UserIcon } from "@heroicons/vue/24/outline";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import { getTableRowClasses } from "@/utils/ui";
import type { DashboardRecentTaskItem } from "../composables/useDashboardSummary";

const props = defineProps<{
  items: DashboardRecentTaskItem[];
  loading: boolean;
  error: Error | null;
}>();

const hasItems = computed(() => props.items.length > 0);

const statusDotClasses: Record<DashboardRecentTaskItem["status"], string> = {
  success: "bg-success",
  error: "bg-error",
};
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasItems"
    error-title="Recent Tasks Error"
    empty-message="No recent tasks"
  >
    <template #loading>
      <DataTable :compact="true" :zebra="true">
        <thead>
          <tr>
            <th>Task</th>
            <th>Worker</th>
            <th>Started</th>
            <th class="text-right">Duration</th>
            <th class="text-right">Queue</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="index in 6"
            :key="`rt-skel-${index}`"
            class="recent-task-row"
          >
            <td colspan="6" class="py-3">
              <div class="bg-base-200/70 h-4 w-full animate-pulse rounded" />
            </td>
          </tr>
        </tbody>
      </DataTable>
    </template>

    <DataTable v-if="hasItems" :compact="true" :zebra="true">
      <thead>
        <tr>
          <th class="w-1/4">Task</th>
          <th class="w-1/4">Worker</th>
          <th class="w-[18%]">Started</th>
          <th class="w-[12%] text-right">Duration</th>
          <th class="w-[10%] text-right">Queue</th>
          <th class="w-[22%]">Notes</th>
        </tr>
      </thead>
      <TransitionGroup tag="tbody" name="recent-task">
        <tr
          v-for="item in items"
          :key="item.id"
          :class="[getTableRowClasses(), 'recent-task-row text-sm']"
        >
          <td class="text-base-content font-medium">
            <div class="flex items-center gap-2">
              <span
                class="mt-0.5 h-2.5 w-2.5 rounded-full"
                :class="statusDotClasses[item.status]"
              ></span>
              <span class="truncate">{{ item.title }}</span>
            </div>
          </td>
          <td class="text-base-content/70 text-sm">
            <div class="flex items-center gap-1">
              <UserIcon class="size-3" />
              <span class="truncate">{{
                item.completedBy || "Unknown node"
              }}</span>
            </div>
          </td>
          <td class="text-base-content/60 text-sm" :title="item.started || ''">
            {{ item.startedAgo || "—" }}
          </td>
          <td class="text-base-content/80 text-right font-mono text-xs">
            {{ item.duration || "—" }}
          </td>
          <td class="text-base-content/80 text-right font-mono text-xs">
            {{ item.queued || "—" }}
          </td>
          <td class="text-xs">
            <div
              v-if="item.warningMessage || item.errorMessage"
              class="flex items-start gap-2"
              :class="item.warningMessage ? 'text-warning/80' : 'text-error/80'"
            >
              <ExclamationTriangleIcon class="mt-0.5 size-4" />
              <span
                class="line-clamp-1"
                :title="item.warningMessage || item.errorMessage || ''"
              >
                {{ item.warningMessage || item.errorMessage }}
              </span>
            </div>
            <span v-else class="text-base-content/40">—</span>
          </td>
        </tr>
      </TransitionGroup>
    </DataTable>
  </DataSection>
</template>

<style scoped>
.recent-task-row {
  height: 3.5rem;
}

.recent-task-row td {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.recent-task-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.recent-task-enter-active,
.recent-task-leave-active,
.recent-task-move {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.recent-task-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.recent-task-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.recent-task-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
