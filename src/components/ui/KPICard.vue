<script setup lang="ts">
import type { Component } from "vue";

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
}

withDefaults(defineProps<KPICardProps>(), {
  subtitle: "",
  trend: "neutral",
  icon: undefined,
  iconColor: "primary",
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
</script>

<template>
  <div
    class="bg-base-100 border-base-300 hover:border-primary/20 rounded-xl border p-5 transition-all duration-200 hover:shadow-lg"
  >
    <div class="mb-3 flex items-start justify-between">
      <div class="flex-1">
        <div class="text-base-content/60 mb-1 text-sm font-medium">
          {{ label }}
        </div>
        <div class="text-base-content text-3xl font-bold tracking-tight">
          {{ value }}
        </div>
      </div>

      <div
        v-if="icon"
        class="ml-3 rounded-lg p-2.5"
        :class="iconBgColors[iconColor]"
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
