<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from "reka-ui";
import { computed } from "vue";
import type { Component } from "vue";

interface ProgressStatProps {
  label: string;
  value: number;
  max?: number;
  color?:
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
  icon?: Component;
  showPercentage?: boolean;
}

const props = withDefaults(defineProps<ProgressStatProps>(), {
  max: 100,
  color: "primary",
  icon: undefined,
  showPercentage: true,
});

const progressColors = {
  primary: "progress-primary",
  secondary: "progress-secondary",
  accent: "progress-accent",
  info: "progress-info",
  success: "progress-success",
  warning: "progress-warning",
  error: "progress-error",
};

const percentage = computed(() => Math.round((props.value / props.max) * 100));
</script>

<template>
  <div class="border-base-300 rounded-lg border p-3">
    <div class="mb-2 flex items-center justify-between text-sm">
      <span class="flex items-center gap-2">
        <component :is="icon" v-if="icon" class="size-4" />
        {{ label }}
      </span>
      <span v-if="showPercentage">{{ percentage }}%</span>
    </div>

    <!-- 使用 reka-ui Progress 提供语义化和可访问性 -->
    <ProgressRoot :value="value" :max="max" class="w-full">
      <ProgressIndicator
        class="progress w-full"
        :class="progressColors[color]"
        :value="value"
        :max="max"
      />
    </ProgressRoot>
  </div>
</template>
