<script setup lang="ts">
import { ref, computed } from "vue";
import CollapsibleSidebar from "./CollapsibleSidebar.vue";
import SettingsModal from "@/components/composed/SettingsModal.vue";
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
  SignalIcon,
} from "@heroicons/vue/24/outline";

import { useLayoutStore } from "@/stores/layout";

const mobileMenuOpen = ref(false);
const layoutStore = useLayoutStore();
const searchQuery = ref("");
const searchFocused = ref(false);
const settingsModalOpen = ref(false);

const mainContentMargin = computed(() =>
  layoutStore.sidebarCollapsed ? "4rem" : "16rem",
);

const handleSearch = (query: string) => {
  console.log("Search query:", query);
};

const handleNotifications = () => {
  console.log("Open notifications");
};

const handleSettings = () => {
  settingsModalOpen.value = true;
};
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
        class="bg-base-100/90 border-base-300/50 sticky top-0 z-20 border-b backdrop-blur-md"
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
            <div class="relative">
              <div
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
              >
                <MagnifyingGlassIcon class="text-base-content/50 size-4" />
              </div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search tasks, machines, sectors..."
                class="input input-sm bg-base-200/50 border-base-300/50 focus:bg-base-200 focus:border-primary/50 w-full pr-4 pl-9 transition-all"
                @focus="searchFocused = true"
                @blur="searchFocused = false"
                @keyup.enter="handleSearch(searchQuery)"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                <kbd class="kbd kbd-xs">⌘K</kbd>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <div class="mr-2 flex items-center gap-1">
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

            <div class="dropdown dropdown-end">
              <div
                tabindex="0"
                role="button"
                class="btn btn-ghost btn-sm gap-2 px-2"
              >
                <div class="avatar">
                  <div
                    class="from-accent to-secondary size-6 rounded-full bg-gradient-to-br"
                  >
                    <div
                      class="grid size-full place-items-center text-xs font-semibold text-white"
                    >
                      A
                    </div>
                  </div>
                </div>
                <span class="hidden text-sm font-medium sm:block">Admin</span>
              </div>
              <ul
                tabindex="0"
                class="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow-lg"
              >
                <li>
                  <a
                    ><div class="flex items-center gap-2">
                      <SignalIcon class="size-4" />System Status
                    </div></a
                  >
                </li>
                <li>
                  <a @click="handleSettings"
                    ><div class="flex items-center gap-2">
                      <Cog6ToothIcon class="size-4" />Endpoint Settings
                    </div></a
                  >
                </li>
                <div class="divider my-1"></div>
                <li>
                  <a class="text-error"
                    ><div class="flex items-center gap-2">Sign Out</div></a
                  >
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="relative">
        <slot />
      </div>
    </main>

    <SettingsModal v-model:open="settingsModalOpen" />
  </div>
</template>
