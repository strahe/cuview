<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import { InformationCircleIcon } from "@heroicons/vue/24/outline";
import Card from "./Card.vue";
import { useLayoutStore } from "@/stores/layout";

type AccentColor =
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";

interface Props {
  title: string;
  description?: string;
  accent?: AccentColor;
  icon?: Component;
  loading?: boolean;
  skeletonHeight?: number;
  padded?: boolean;
  descriptionVariant?: "text" | "tooltip";
}

const props = withDefaults(defineProps<Props>(), {
  description: undefined,
  accent: "primary" as AccentColor,
  icon: undefined,
  loading: false,
  skeletonHeight: 280,
  padded: true,
  descriptionVariant: "text" as const,
});

const layoutStore = useLayoutStore();

const accentBarClasses: Record<AccentColor, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  accent: "bg-accent",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};

const surfaceOverlayStyle = computed(() => ({
  background: layoutStore.isDark
    ? "linear-gradient(135deg, color-mix(in srgb, var(--color-base-300) 46%, transparent) 0%, color-mix(in srgb, var(--color-base-200) 52%, transparent) 100%)"
    : "linear-gradient(135deg, color-mix(in srgb, var(--color-base-100) 84%, var(--color-base-200) 16%) 0%, color-mix(in srgb, var(--color-base-100) 58%, var(--color-base-300) 42%) 100%)",
}));

const bodyPadding = computed(() =>
  props.padded ? "px-4 pb-4 pt-3 md:px-5 md:pb-5 md:pt-4" : "p-0",
);

const skeletonStyle = computed(() => ({ height: `${props.skeletonHeight}px` }));

const cardClasses =
  "relative overflow-hidden border-base-300 bg-base-100 shadow-xl transition-all duration-200 supports-[backdrop-filter]:backdrop-blur-md";

const useTooltipDescription = computed(
  () => props.description && props.descriptionVariant === "tooltip",
);
</script>

<template>
  <Card
    variant="bordered"
    :class="cardClasses"
    :header-class="'border-none px-5 pt-5 pb-3 md:px-6 md:pt-6 md:pb-3'"
    :body-class="'px-0 pt-0 pb-0'"
  >
    <template #header>
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-start gap-3">
          <span
            class="mt-0.5 h-9 w-1 rounded-full"
            :class="accentBarClasses[accent]"
            aria-hidden="true"
          ></span>
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <component
                :is="icon"
                v-if="icon"
                class="text-base-content/70 size-5"
              />
              <h3 class="text-base-content text-lg leading-tight font-semibold">
                {{ title }}
              </h3>
              <div v-if="useTooltipDescription" class="group relative">
                <InformationCircleIcon
                  class="text-base-content/60 hover:text-base-content/80 size-4 cursor-help transition-colors"
                />
                <div
                  class="bg-base-200 text-base-content border-base-300 pointer-events-none absolute top-full left-1/2 z-50 mt-2 w-64 -translate-x-1/2 rounded-lg border px-3 py-2 text-xs leading-relaxed opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
                  role="tooltip"
                >
                  {{ description }}
                </div>
              </div>
            </div>

            <p
              v-if="description && !useTooltipDescription"
              class="text-base-content/60 text-sm leading-relaxed"
            >
              {{ description }}
            </p>
          </div>
        </div>

        <div v-if="$slots.actions" class="flex items-center gap-2">
          <slot name="actions" />
        </div>
      </div>
    </template>

    <div :class="['relative', bodyPadding]">
      <div
        class="pointer-events-none absolute inset-0 -z-10 opacity-60 transition-opacity"
        :style="surfaceOverlayStyle"
        aria-hidden="true"
      ></div>

      <div
        v-if="loading"
        class="bg-base-200 border-base-300 h-full w-full animate-pulse rounded-2xl border"
        :style="skeletonStyle"
      ></div>

      <div v-else class="relative">
        <slot />
      </div>
    </div>
  </Card>
</template>
