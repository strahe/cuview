<script setup lang="ts">
import { computed } from "vue";
import { InformationCircleIcon } from "@heroicons/vue/24/outline";
import Card from "./Card.vue";

interface Props {
  title?: string;
  description?: string;
  icon?: unknown;
  loading?: boolean;
  class?: string;
  tooltip?: string;
}

const props = defineProps<Props>();

const iconComponent = computed(() => props.icon);
</script>

<template>
  <Card
    :title="tooltip ? undefined : title"
    :description="description"
    :icon="tooltip ? undefined : iconComponent"
    :loading="loading"
    :class="props.class"
  >
    <!-- Custom header with tooltip when tooltip prop is provided -->
    <template v-if="tooltip" #header>
      <div class="flex items-center justify-between">
        <div class="card-title flex items-center gap-2">
          <!-- Icon -->
          <component
            :is="iconComponent"
            v-if="iconComponent"
            class="size-5 shrink-0"
          />

          <!-- Title with Info Icon -->
          <div class="flex items-center gap-2">
            <span v-if="title">{{ title }}</span>

            <!-- Info Icon with Tooltip -->
            <div class="group relative">
              <InformationCircleIcon
                class="text-base-content/60 hover:text-base-content/80 size-4 cursor-help transition-colors"
                aria-label="More information"
              />

              <!-- Tooltip -->
              <div
                class="tooltip bg-base-300 text-base-content pointer-events-none absolute top-full left-1/2 z-50 mt-2 w-80 max-w-sm -translate-x-1/2 rounded-lg px-4 py-3 text-sm leading-relaxed opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
                role="tooltip"
              >
                {{ tooltip }}
              </div>
            </div>
          </div>

          <!-- Loading indicator -->
          <div
            v-if="loading"
            class="loading loading-spinner loading-sm ml-2"
          ></div>
        </div>

        <!-- Actions slot -->
        <div v-if="$slots.actions">
          <slot name="actions" />
        </div>
      </div>
    </template>

    <!-- Forward actions slot to Card when no tooltip -->
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>

    <slot />
  </Card>
</template>
