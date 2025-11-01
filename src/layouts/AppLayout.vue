<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import CollapsibleSidebar from "./CollapsibleSidebar.vue";
import SettingsModal from "@/components/composed/SettingsModal.vue";
import AppQuickSearch from "@/components/composed/AppQuickSearch.vue";
import ConnectionStatus from "@/components/ui/ConnectionStatus.vue";
import ThemeToggle from "@/components/ui/ThemeToggle.vue";
import NetworkSimulationToggle from "@/components/ui/NetworkSimulationToggle.vue";
import ActiveTasksDropdown from "@/components/composed/ActiveTasksDropdown.vue";
import {
  Bars3Icon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  BellIcon,
  Cog6ToothIcon,
} from "@heroicons/vue/24/outline";

import { useLayoutStore } from "@/stores/layout";

const mobileMenuOpen = ref(false);
const layoutStore = useLayoutStore();
const settingsModalOpen = ref(false);
const quickSearchOpen = ref(false);

const mainContentMargin = computed(() =>
  layoutStore.sidebarCollapsed ? "4rem" : "16rem",
);

const handleNotifications = () => {
  console.log("Open notifications");
};

const handleSettings = () => {
  settingsModalOpen.value = true;
};

const openQuickSearch = () => {
  quickSearchOpen.value = true;
};

const handleShortcut = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === "k") {
    event.preventDefault();
    quickSearchOpen.value = true;
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleShortcut);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleShortcut);
});
</script>

<template>
  <div class="bg-base-300 flex min-h-screen">
    <div class="fixed top-0 left-0 z-30 hidden lg:block">
      <CollapsibleSidebar :is-collapsed="layoutStore.sidebarCollapsed" />
    </div>

    <div class="w-full lg:hidden">
      <div class="drawer">
        <input
          id="mobile-drawer-toggle"
          v-model="mobileMenuOpen"
          type="checkbox"
          class="drawer-toggle"
        />

        <div class="drawer-content flex flex-col">
          <div class="navbar bg-base-100 shadow-sm">
            <div class="navbar-start">
              <label
                for="mobile-drawer-toggle"
                class="btn btn-square btn-ghost"
              >
                <Bars3Icon class="size-6" />
              </label>
            </div>
            <div class="navbar-center">
              <div class="flex items-center gap-2">
                <div
                  class="bg-primary text-primary-content grid size-8 place-items-center rounded-lg font-semibold"
                >
                  C
                </div>
                <span class="text-lg font-semibold">Cuview</span>
              </div>
            </div>
            <div class="navbar-end"></div>
          </div>

          <main class="flex-1">
            <slot />
          </main>
        </div>

        <div class="drawer-side">
          <label
            for="mobile-drawer-toggle"
            aria-label="close sidebar"
            class="drawer-overlay"
          ></label>
          <div class="w-64">
            <CollapsibleSidebar />
          </div>
        </div>
      </div>
    </div>

    <main
      class="hidden min-h-screen flex-1 transition-all duration-300 lg:block"
      :style="{ marginLeft: mainContentMargin }"
    >
      <div
        class="bg-base-100 border-base-300 sticky top-0 z-20 border-b shadow-sm backdrop-blur-md"
      >
        <div class="flex items-center justify-between px-6 py-3">
          <div class="flex items-center gap-3">
            <button
              class="btn btn-ghost btn-sm size-9 p-0"
              :title="
                layoutStore.sidebarCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              "
              @click="layoutStore.toggleSidebar"
            >
              <Bars3Icon v-if="layoutStore.sidebarCollapsed" class="size-5" />
              <ChevronLeftIcon v-else class="size-5" />
            </button>

            <ConnectionStatus />
          </div>

          <div class="mx-8 max-w-md flex-1">
            <button
              type="button"
              class="bg-base-200 border-base-300 hover:border-primary focus-visible:ring-primary/40 focus-visible:ring-offset-base-100 text-base-content/70 flex h-9 w-full items-center justify-between rounded-lg border px-3 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              @click="openQuickSearch"
            >
              <span class="flex items-center gap-2">
                <MagnifyingGlassIcon class="text-base-content/50 size-4" />
                <span class="truncate"
                  >Search pages, actors, or task types</span
                >
              </span>
              <kbd class="kbd kbd-xs hidden sm:inline-flex">⌘K</kbd>
            </button>
          </div>

          <div class="flex items-center gap-1">
            <div class="flex items-center gap-1">
              <button
                class="btn btn-ghost btn-sm relative size-9 p-0"
                title="Notifications"
                @click="handleNotifications"
              >
                <BellIcon class="size-5" />
                <div
                  class="bg-warning absolute -top-1 -right-1 size-3 rounded-full"
                ></div>
              </button>

              <ActiveTasksDropdown />

              <ThemeToggle />

              <NetworkSimulationToggle />

              <button
                class="btn btn-ghost btn-sm size-9 p-0"
                title="Settings"
                @click="handleSettings"
              >
                <Cog6ToothIcon class="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="relative">
        <slot />
      </div>
    </main>

    <SettingsModal v-model:open="settingsModalOpen" />
    <AppQuickSearch v-model:open="quickSearchOpen" />
  </div>
</template>
