<script setup lang="ts">
import { computed } from "vue";
import { useConnectionStore } from "@/stores/connection";

const connectionStore = useConnectionStore();

const statusConfig = computed(() => {
  const status = connectionStore.status;
  const attempt = connectionStore.reconnectAttempt;

  switch (status) {
    case "connected":
      return {
        class: "bg-success/10 text-success",
        dotClass: "bg-success",
        text: "Connected",
        animate: false,
      };
    case "connecting":
      return {
        class: "bg-warning/10 text-warning",
        dotClass: "bg-warning",
        text: "Connecting",
        animate: true,
      };
    case "reconnecting":
      return {
        class: "bg-warning/10 text-warning",
        dotClass: "bg-warning",
        text: attempt > 0 ? `Reconnecting (${attempt})` : "Reconnecting",
        animate: true,
      };
    case "disconnected":
      return {
        class: "bg-error/10 text-error",
        dotClass: "bg-error",
        text: "Disconnected",
        animate: false,
      };
    default:
      return {
        class: "bg-base-200 text-base-content/70",
        dotClass: "bg-base-300",
        text: "Unknown",
        animate: false,
      };
  }
});
</script>

<template>
  <div
    :class="[
      'flex items-center gap-2 rounded-full px-3 py-1.5 transition-all',
      statusConfig.class,
    ]"
  >
    <div
      :class="[
        'size-2 rounded-full transition-all',
        statusConfig.dotClass,
        statusConfig.animate ? 'animate-pulse' : '',
      ]"
    ></div>
    <span class="text-xs font-medium">{{ statusConfig.text }}</span>
  </div>
</template>
