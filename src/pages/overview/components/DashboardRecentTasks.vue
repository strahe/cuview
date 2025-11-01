<script setup lang="ts">
import { computed } from "vue";
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import { getTableRowClasses } from "@/utils/ui";
import type { TaskHistorySummary } from "@/types/task";

interface Props {
  items: TaskHistorySummary[];
  loading: boolean;
  error: Error | null;
}

const props = defineProps<Props>();

const hasItems = computed(() => props.items.length > 0);
const limitedItems = computed(() => props.items.slice(0, 20));
const getStatusDot = (result: boolean) => (result ? "bg-success" : "bg-error");
const getItemKey = (item: TaskHistorySummary, index: number) =>
  `${index}-${item.TaskID}-${item.Start}-${item.End || "no-end"}`;
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasItems"
    error-title="Recent Tasks Error"
    empty-message="No recent tasks"
  >
    <template #loading>Loading recent tasks...</template>

    <DataTable v-if="hasItems" :compact="true" :zebra="true">
      <thead>
        <tr>
          <th class="w-[18%]">Task</th>
          <th class="w-[18%]">Worker</th>
          <th class="w-[17%]">Started</th>
          <th class="w-[12%]">Duration</th>
          <th class="w-[10%]">Queue</th>
          <th class="w-[25%]">Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in limitedItems"
          :key="getItemKey(item, index)"
          :class="getTableRowClasses()"
        >
          <td class="font-medium">
            <div class="flex items-center gap-2">
              <span
                class="mt-0.5 h-2.5 w-2.5 rounded-full"
                :class="getStatusDot(item.Result)"
              ></span>
              <span class="truncate">{{ item.Name }}</span>
            </div>
          </td>
          <td class="text-sm">
            <span class="block truncate">{{
              item.CompletedBy || "Unknown node"
            }}</span>
          </td>
          <td class="text-sm whitespace-nowrap">{{ item.Start }}</td>
          <td class="font-mono text-xs">{{ item.Took }}</td>
          <td class="font-mono text-xs">{{ item.Queued }}</td>
          <td class="text-xs">
            <div
              v-if="item.Err"
              class="flex items-start gap-2"
              :class="item.Result ? 'text-warning' : 'text-error'"
            >
              <ExclamationTriangleIcon class="mt-0.5 size-4" />
              <span class="line-clamp-1" :title="item.Err">{{ item.Err }}</span>
            </div>
            <span v-else class="text-base-content/60">—</span>
          </td>
        </tr>
      </tbody>
    </DataTable>
  </DataSection>
</template>
