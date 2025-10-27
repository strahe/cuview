<script setup lang="ts">
import { computed } from "vue";

interface Props {
  unschedulable: boolean;
  sinceContact: string;
  runningTasks?: number;
  restarting?: boolean;
  restartRequest?: string;
}

const props = defineProps<Props>();

const status = computed(() => {
  // Check if machine is restarting first (highest priority)
  if (props.restarting && props.restartRequest) {
    return {
      label: "Restarting",
      additionalInfo: [props.restartRequest],
      class: "text-info",
      tooltip: `Machine restart requested: ${props.restartRequest}`,
    };
  }

  // Simple heuristic for determining if machine is offline
  // If last contact was more than 60 seconds ago, consider offline
  const contactMatch = props.sinceContact.match(/(\d+)s/);
  const secondsRaw = contactMatch?.[1];
  const secondsSinceContact = secondsRaw ? Number.parseInt(secondsRaw, 10) : 0;

  if (secondsSinceContact > 60) {
    return {
      label: "Offline",
      additionalInfo: [`Last contact ${props.sinceContact}`],
      class: "text-error",
      tooltip: `Machine is offline. Last contact: ${props.sinceContact}`,
    };
  }

  if (props.unschedulable) {
    let tooltip = "Machine is cordoned - no new tasks will be scheduled";
    if (props.runningTasks && props.runningTasks > 0) {
      tooltip += `. Currently running ${props.runningTasks} task${props.runningTasks > 1 ? "s" : ""}`;
    }

    return {
      label: "Cordoned",
      class: "text-warning",
      tooltip,
    };
  }

  return {
    label: "Online",
    class: "text-success",
    tooltip: `Machine is online. Last contact: ${props.sinceContact}`,
  };
});
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      class="badge badge-outline text-xs"
      :class="status.class"
      :title="status.tooltip"
    >
      <span>{{ status.label }}</span>
      <span
        v-if="props.runningTasks && props.runningTasks > 0"
        class="font-medium"
      >
        ({{ props.runningTasks }})
      </span>
    </div>
    <div v-if="status.additionalInfo" class="space-y-0.5">
      <div
        v-for="(info, index) in status.additionalInfo"
        :key="index"
        class="text-base-content/60 text-[11px]"
      >
        {{ info }}
      </div>
    </div>
  </div>
</template>
