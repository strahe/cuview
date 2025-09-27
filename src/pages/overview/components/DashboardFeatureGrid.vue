<script setup lang="ts">
import { RouterLink } from "vue-router";
import type { Component } from "vue";

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  to: string;
  icon: Component;
  badge?: string;
  badgeVariant?:
    | "badge-primary"
    | "badge-secondary"
    | "badge-accent"
    | "badge-info"
    | "badge-success"
    | "badge-warning"
    | "badge-error";
  accent?: "primary" | "secondary" | "accent" | "info" | "success" | "warning";
}

defineProps<{
  features: FeatureCard[];
}>();

const accentClasses: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <RouterLink
      v-for="feature in features"
      :key="feature.id"
      :to="feature.to"
      class="border-base-300 hover:border-primary/30 relative flex h-full flex-col rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div class="flex items-start justify-between gap-3">
        <div
          class="rounded-xl p-3"
          :class="accentClasses[feature.accent || 'primary']"
        >
          <component :is="feature.icon" class="size-6" />
        </div>
        <span
          v-if="feature.badge"
          class="badge badge-sm"
          :class="feature.badgeVariant || 'badge-outline'"
        >
          {{ feature.badge }}
        </span>
      </div>
      <h3 class="text-base-content mt-4 text-lg font-semibold">
        {{ feature.title }}
      </h3>
      <p class="text-base-content/60 mt-2 text-sm leading-relaxed">
        {{ feature.description }}
      </p>
      <div
        class="text-primary mt-auto flex items-center gap-1 pt-4 text-sm font-semibold"
      >
        View details
        <span aria-hidden="true">→</span>
      </div>
    </RouterLink>
  </div>
</template>
