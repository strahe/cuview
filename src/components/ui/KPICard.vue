<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";

type CardSize = "default" | "compact";

interface KPICardProps {
  value: string | number;
  label: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  icon?: Component;
  iconColor?:
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
  size?: CardSize;
}

const props = withDefaults(defineProps<KPICardProps>(), {
  subtitle: "",
  trend: "neutral",
  icon: undefined,
  iconColor: "primary",
  size: "default",
});

const trendColors = {
  up: "text-success",
  down: "text-error",
  neutral: "text-base-content/60",
};

const iconBgColors = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
};

const sizeMap = {
  default: {
    container: "p-5",
    value: "text-3xl",
    icon: "p-2.5",
    gap: "mb-3",
  },
  compact: {
    container: "p-4",
    value: "text-2xl",
    icon: "p-2",
    gap: "mb-2",
  },
} as const satisfies Record<
  CardSize,
  { container: string; value: string; icon: string; gap: string }
>;

const sizeClasses = computed(() => sizeMap[props.size]);
</script>

<template>
  <div
    class="bg-base-100 border-base-300 hover:border-primary/20 rounded-xl border transition-all duration-200 hover:shadow-lg"
    :class="sizeClasses.container"
  >
    <div class="flex items-start justify-between" :class="sizeClasses.gap">
      <div class="flex-1">
        <div class="text-base-content/60 mb-1 text-sm font-medium">
          {{ label }}
        </div>
        <div
          class="text-base-content font-bold tracking-tight"
          :class="sizeClasses.value"
        >
          {{ value }}
        </div>
      </div>

      <div
        v-if="icon"
        class="ml-3 rounded-lg"
        :class="[iconBgColors[iconColor], sizeClasses.icon]"
      >
        <component :is="icon" class="size-5" />
      </div>
    </div>

    <div
      v-if="subtitle"
      class="text-xs font-medium"
      :class="trendColors[trend]"
    >
      {{ subtitle }}
    </div>
  </div>
</template>
