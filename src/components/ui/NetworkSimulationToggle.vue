<script setup lang="ts">
import { useDebugStore } from "@/stores/debug";
import {
  CheckCircleIcon,
  GlobeAltIcon,
  NoSymbolIcon,
  ClockIcon,
} from "@heroicons/vue/24/outline";

const debugStore = useDebugStore();

const networkOptions = [
  {
    value: "normal",
    label: "Normal",
    icon: GlobeAltIcon,
    desc: "Normal connection speed",
    class: "text-success",
  },
  {
    value: "offline",
    label: "Offline",
    icon: NoSymbolIcon,
    desc: "Connection failed",
    class: "text-error",
  },
  {
    value: "slow",
    label: "Slow Network",
    icon: ClockIcon,
    desc: "3 second delay",
    class: "text-warning",
  },
  {
    value: "timeout",
    label: "Timeout",
    icon: ClockIcon,
    desc: "30 second timeout",
    class: "text-warning",
  },
];

const getCurrentOption = () => {
  return networkOptions.find(
    (opt) => opt.value === debugStore.networkSimulation,
  );
};

const setNetworkMode = (mode: "normal" | "offline" | "slow" | "timeout") => {
  debugStore.setNetworkSimulation(mode);
  // Close dropdown by removing focus
  (document.activeElement as HTMLElement)?.blur();
};
</script>

<template>
  <div v-if="debugStore.isDebugMode" class="dropdown dropdown-end">
    <div
      tabindex="0"
      role="button"
      class="btn btn-ghost btn-sm gap-2 px-2"
      :class="getCurrentOption()?.class"
    >
      <component :is="getCurrentOption()?.icon" class="h-4 w-4" />
      <span class="hidden text-xs sm:inline">{{
        getCurrentOption()?.label
      }}</span>
      <svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </div>
    <ul
      tabindex="0"
      class="dropdown-content menu bg-base-100 rounded-box border-base-300 z-[1] w-56 border p-2 shadow-lg"
    >
      <li class="menu-title">
        <span class="text-base-content/70 text-xs font-semibold"
          >Network Simulation</span
        >
      </li>
      <li v-for="option in networkOptions" :key="option.value">
        <button
          class="flex items-center justify-between px-3 py-2 text-sm"
          :class="{ active: debugStore.networkSimulation === option.value }"
          @click="
            setNetworkMode(
              option.value as 'normal' | 'offline' | 'slow' | 'timeout',
            )
          "
        >
          <div class="flex items-center gap-3">
            <component
              :is="option.icon"
              class="h-5 w-5"
              :class="option.class"
            />
            <div class="flex flex-col items-start">
              <span class="font-medium">{{ option.label }}</span>
              <span class="text-xs opacity-70">{{ option.desc }}</span>
            </div>
          </div>
          <CheckCircleIcon
            v-if="debugStore.networkSimulation === option.value"
            class="size-4"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
