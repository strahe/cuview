<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  HomeIcon,
  CpuChipIcon,
  CircleStackIcon,
  BuildingStorefrontIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  WalletIcon,
  GlobeAltIcon,
  CogIcon,
  ServerStackIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/vue/24/outline";

interface NavItem {
  label: string;
  icon: unknown;
  active?: boolean;
  to: string;
  activePattern?: string; // Optional pattern for active state matching
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    icon: HomeIcon,
    to: "/overview",
  },
  {
    label: "Tasks",
    icon: WrenchScrewdriverIcon,
    to: "/tasks/overview",
    activePattern: "^/tasks/.*", // Match all /tasks/* routes
  },
  {
    label: "Machines",
    icon: CpuChipIcon,
    to: "/machines",
  },
  {
    label: "Sectors",
    icon: CircleStackIcon,
    to: "/sectors",
  },
  {
    label: "Storage",
    icon: ServerStackIcon,
    to: "/storage",
  },
  {
    label: "Pipeline",
    icon: ArrowsRightLeftIcon,
    to: "/pipeline",
    activePattern: "^/pipeline.*", // Match all /pipeline/* routes
  },
  {
    label: "Market",
    icon: BuildingStorefrontIcon,
    to: "/market",
    activePattern: "^/market.*", // Match all /market/* routes
  },
  {
    label: "Actor",
    icon: UserIcon,
    to: "/actor",
    activePattern: "^/actor.*", // Match all /actor/* routes
  },
  {
    label: "Wallets",
    icon: WalletIcon,
    to: "/wallets",
  },
  {
    label: "IPNI",
    icon: GlobeAltIcon,
    to: "/ipni",
  },
  {
    label: "Config",
    icon: CogIcon,
    to: "/config",
  },
];

const { isCollapsed = false } = defineProps<{
  isCollapsed?: boolean;
}>();

const route = useRoute();

// Check if navigation item should be active
const isNavItemActive = (item: NavItem): boolean => {
  if (item.activePattern) {
    // If has custom active pattern, use regex matching
    const pattern = new RegExp(item.activePattern);
    return pattern.test(route.path);
  }
  // Otherwise use exact matching
  return route.path === item.to;
};

const sidebarClasses = computed(() => [
  "transition-all duration-300 ease-in-out bg-base-100 shadow-xl h-screen flex flex-col",
  isCollapsed ? "w-16" : "w-64",
]);
</script>

<template>
  <aside :class="sidebarClasses">
    <div class="border-base-300 flex h-20 flex-col justify-center border-b p-4">
      <div v-if="!isCollapsed" class="flex items-center gap-3">
        <div
          class="bg-neutral text-neutral-content grid size-10 place-items-center rounded-xl text-lg font-bold"
        >
          C
        </div>
        <div>
          <h1 class="text-lg font-bold">Cuview</h1>
          <p class="text-base-content/60 text-xs">Control Panel</p>
        </div>
      </div>

      <div v-else class="flex items-center justify-center">
        <div
          class="bg-neutral text-neutral-content grid size-10 place-items-center rounded-xl text-lg font-bold"
        >
          C
        </div>
      </div>
    </div>

    <nav class="flex-1" :class="isCollapsed ? 'p-2' : 'p-4'">
      <div class="space-y-1">
        <template v-for="item in navItems" :key="item.label">
          <div class="relative">
            <router-link
              :to="item.to"
              class="hover:bg-base-200 group relative flex h-10 items-center rounded-lg text-sm font-medium transition-all duration-200"
              :class="[
                isCollapsed ? 'w-10 justify-center px-2' : 'gap-3 px-3',
                isNavItemActive(item)
                  ? 'bg-neutral text-neutral-content hover:bg-neutral-focus shadow-inner'
                  : 'text-base-content/80',
              ]"
              :title="isCollapsed ? item.label : ''"
            >
              <component :is="item.icon" class="size-5 shrink-0" />

              <!-- Text container only when expanded -->
              <div v-if="!isCollapsed" class="flex min-w-0 flex-1 items-center">
                <Transition name="slide-left">
                  <span v-if="!isCollapsed" class="truncate">{{
                    item.label
                  }}</span>
                </Transition>
              </div>
            </router-link>

            <Transition name="tooltip">
              <div
                v-if="isCollapsed"
                class="tooltip bg-neutral text-neutral-content absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg"
              >
                {{ item.label }}
              </div>
            </Transition>
          </div>
        </template>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

.tooltip {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.group:hover .tooltip {
  opacity: 1;
}

.btn {
  position: relative;
  z-index: 10;
}
</style>
