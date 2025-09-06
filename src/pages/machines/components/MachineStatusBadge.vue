<script setup lang="ts">
import { computed } from "vue";
import { getTaskStatusBadgeColor } from "@/utils/ui";

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
      class: getTaskStatusBadgeColor("running"),
      icon: "🔄",
      tooltip: `Machine restart requested: ${props.restartRequest}`,
    };
  }

  // Simple heuristic for determining if machine is offline
  // If last contact was more than 60 seconds ago, consider offline
  const contactMatch = props.sinceContact.match(/(\d+)s/);
  const secondsSinceContact = contactMatch ? parseInt(contactMatch[1]) : 0;

  if (secondsSinceContact > 60) {
    return {
      label: "Offline",
      additionalInfo: [`Last contact ${props.sinceContact}`],
      class: getTaskStatusBadgeColor("error"),
      icon: "🔴",
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
      class: getTaskStatusBadgeColor("pending"),
      icon: "⚠️",
      tooltip,
    };
  }

  return {
    label: "Online",
    class: getTaskStatusBadgeColor("success"),
    icon: "🟢",
    tooltip: `Machine is online. Last contact: ${props.sinceContact}`,
  };
});
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      class="badge gap-1 text-xs"
      :class="status.class"
      :title="status.tooltip"
    >
      <span>{{ status.icon }}</span>
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
