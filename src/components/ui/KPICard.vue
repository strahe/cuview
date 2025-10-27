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
    | "error"
    | "neutral"
    | "muted";
  size?: CardSize;
}

const props = withDefaults(defineProps<KPICardProps>(), {
  subtitle: "",
  trend: "neutral",
  icon: undefined,
  iconColor: "neutral",
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
  neutral: "bg-base-200 text-base-content/70 border border-base-300",
  muted: "bg-base-100 text-base-content/60 border border-base-200",
};

const sizeMap = {
  default: {
    container: "",
    value: "",
    icon: "p-2.5",
  },
  compact: {
    container: "",
    value: "text-xl",
    icon: "p-2",
  },
} as const satisfies Record<
  CardSize,
  { container: string; value: string; icon: string }
>;

const sizeClasses = computed(() => sizeMap[props.size]);
</script>

<template>
  <div
    class="stats bg-base-100 border-base-300 hover:border-base-content/30 w-full rounded-xl border transition-all duration-200 hover:shadow-lg"
    :class="sizeClasses.container"
  >
    <div class="stat">
      <div
        v-if="icon"
        class="stat-figure rounded-lg"
        :class="[iconBgColors[iconColor], sizeClasses.icon]"
      >
        <component :is="icon" class="size-5" />
      </div>

      <div class="stat-title">
        {{ label }}
      </div>
      <div class="stat-value" :class="sizeClasses.value">
        {{ value }}
      </div>

      <div v-if="subtitle" class="stat-desc" :class="trendColors[trend]">
        {{ subtitle }}
      </div>
    </div>
  </div>
</template>
