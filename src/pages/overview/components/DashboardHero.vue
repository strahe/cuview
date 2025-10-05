<script setup lang="ts">
import { computed, ref } from "vue";
import type { Component } from "vue";
import {
  ArrowPathIcon,
  BoltIcon,
  CircleStackIcon,
  ServerStackIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/outline";
import KPICard from "@/components/ui/KPICard.vue";
import type {
  DashboardMetrics,
  DashboardStatus,
  HeroSnapshot,
} from "../composables/useDashboardSummary";

type IconColor =
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "muted";

type HeroCardPreset = "machines" | "tasks" | "storage" | "actors";

interface Props {
  metrics: DashboardMetrics;
  status: DashboardStatus;
  lastUpdatedLabel: string;
  formattedTaskSuccessRate: string;
  machineHealthLabel: string;
  runningTasksLabel: string;
  loading: boolean;
  loadingSkeleton: boolean;
  heroSnapshot: HeroSnapshot;
  onRefresh?: () => Promise<void> | void;
}

const props = defineProps<Props>();

const refreshing = ref(false);

const cardIconMap: Record<
  HeroCardPreset,
  { icon: Component; fallbackColor: IconColor }
> = {
  machines: { icon: ServerStackIcon, fallbackColor: "neutral" },
  tasks: { icon: BoltIcon, fallbackColor: "neutral" },
  storage: { icon: CircleStackIcon, fallbackColor: "neutral" },
  actors: { icon: UserGroupIcon, fallbackColor: "neutral" },
};

const statusColorMap: Record<
  HeroSnapshot["cards"][number]["status"],
  IconColor
> = {
  success: "success",
  warning: "warning",
  info: "info",
  accent: "accent",
};

const cards = computed(() =>
  props.heroSnapshot.cards.map((card) => {
    const preset = cardIconMap[card.id];
    const iconColor = (statusColorMap[card.status] ??
      preset.fallbackColor) as IconColor;

    return {
      ...card,
      icon: preset.icon,
      iconColor,
    };
  }),
);

const handleRefresh = async () => {
  if (refreshing.value || !props.onRefresh) return;
  refreshing.value = true;
  try {
    await props.onRefresh();
  } finally {
    refreshing.value = false;
  }
};
</script>

<template>
  <div class="bg-base-100 border-base-300 rounded-2xl border p-5 shadow-sm">
    <div
      class="border-base-300 flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between"
    >
      <div class="flex items-center gap-3">
        <span class="badge" :class="props.status.variant">
          {{ props.status.label }}
        </span>
        <span class="text-base-content text-sm font-semibold">
          Cluster Overview
        </span>
      </div>
      <div
        class="text-base-content/60 flex flex-wrap items-center gap-3 text-xs"
      >
        <span>Updated {{ props.lastUpdatedLabel }}</span>
        <span v-if="props.status.issues > 0" class="text-warning">
          {{ props.status.endpointIssues }} endpoint alerts ·
          {{ props.status.offlineMachines }} machines offline
        </span>
        <button
          class="btn btn-outline btn-xs"
          :disabled="props.loading || refreshing || !props.onRefresh"
          @click="handleRefresh"
        >
          <ArrowPathIcon
            class="size-4"
            :class="{ 'animate-spin': props.loading || refreshing }"
          />
          Refresh
        </button>
      </div>
    </div>

    <div v-if="props.loadingSkeleton" class="mt-4 grid gap-3 md:grid-cols-2">
      <div v-for="index in 4" :key="`skeleton-${index}`" class="animate-pulse">
        <div class="bg-base-200 h-24 rounded-xl" />
      </div>
    </div>

    <div v-else class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <KPICard
        v-for="card in cards"
        :key="card.id"
        :label="card.label"
        :value="card.value"
        :subtitle="card.subtitle"
        :icon="card.icon"
        :icon-color="card.iconColor"
      />
    </div>
  </div>
</template>
*** End Patch
