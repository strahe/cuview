<script setup lang="ts">
import { ref, computed } from 'vue'
import CollapsibleSidebar from './CollapsibleSidebar.vue'
import { 
  Bars3Icon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  BellIcon,
  Cog6ToothIcon,
  SignalIcon
} from '@heroicons/vue/24/outline'

const mobileMenuOpen = ref(false)
const sidebarCollapsed = ref(false)
const searchQuery = ref('')
const searchFocused = ref(false)

const mainContentMargin = computed(() => 
  sidebarCollapsed.value ? '4rem' : '16rem'
)

const handleSearch = (query: string) => {
  // TODO: Implement global search functionality
  console.log('Search query:', query)
}

const handleNotifications = () => {
  // TODO: Open notifications panel
  console.log('Open notifications')
}

const handleSettings = () => {
  // TODO: Navigate to settings page
  console.log('Open settings')
}

</script>

<template>
  <div class="flex min-h-screen bg-base-200/30">
    <!-- Desktop Collapsible Sidebar -->
    <div class="hidden lg:block fixed left-0 top-0 z-30">
      <CollapsibleSidebar :isCollapsed="sidebarCollapsed" />
    </div>

    <!-- Mobile Layout -->
    <div class="lg:hidden w-full">
      <div class="drawer">
        <input id="mobile-drawer-toggle" type="checkbox" class="drawer-toggle" v-model="mobileMenuOpen" />
        
        <!-- Drawer content -->
        <div class="drawer-content flex flex-col">
          <!-- Mobile Top Navigation -->
          <div class="navbar bg-base-100 shadow-sm">
            <div class="navbar-start">
              <label for="mobile-drawer-toggle" class="btn btn-square btn-ghost">
                <Bars3Icon class="size-6" />
              </label>
            </div>
            <div class="navbar-center">
              <div class="flex items-center gap-2">
                <div class="size-8 rounded-lg bg-primary text-primary-content grid place-items-center font-semibold">
                  C
                </div>
                <span class="font-semibold text-lg">Cuview</span>
              </div>
            </div>
            <div class="navbar-end">
              <!-- User menu placeholder -->
            </div>
          </div>

          <!-- Mobile Main content -->
          <main class="flex-1">
            <slot />
          </main>
        </div>

        <!-- Mobile Drawer sidebar -->
        <div class="drawer-side">
          <label for="mobile-drawer-toggle" aria-label="close sidebar" class="drawer-overlay"></label>
          <div class="w-64">
            <CollapsibleSidebar />
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Main content -->
    <main class="flex-1 lg:block hidden overflow-y-auto h-screen transition-all duration-300" :style="{ marginLeft: mainContentMargin }">
      <!-- Enhanced top bar -->
      <div class="sticky top-0 z-20 bg-base-100/90 backdrop-blur-md border-b border-base-300/50">
        <div class="flex items-center justify-between px-6 py-3">
          <!-- Left section -->
          <div class="flex items-center gap-3">
            <button 
              @click="sidebarCollapsed = !sidebarCollapsed"
              class="btn btn-ghost btn-sm size-9 p-0"
              :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            >
              <Bars3Icon v-if="sidebarCollapsed" class="size-5" />
              <ChevronLeftIcon v-else class="size-5" />
            </button>
            
            <!-- Connection status indicator -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success">
              <div class="size-2 rounded-full bg-success animate-pulse"></div>
              <span class="text-xs font-medium">Connected</span>
            </div>
          </div>

          <!-- Center section - Search -->
          <div class="flex-1 max-w-md mx-8">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon class="size-4 text-base-content/50" />
              </div>
              <input
                v-model="searchQuery"
                @focus="searchFocused = true"
                @blur="searchFocused = false"
                @keyup.enter="handleSearch(searchQuery)"
                type="text"
                placeholder="Search tasks, machines, sectors..."
                class="input input-sm w-full pl-9 pr-4 bg-base-200/50 border-base-300/50 focus:bg-base-200 focus:border-primary/50 transition-all"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <kbd class="kbd kbd-xs">⌘K</kbd>
              </div>
            </div>
          </div>

          <!-- Right section -->
          <div class="flex items-center gap-1">
            <!-- Quick actions -->
            <div class="flex items-center gap-1 mr-2">
              <button 
                @click="handleNotifications"
                class="btn btn-ghost btn-sm size-9 p-0 relative"
                title="Notifications"
              >
                <BellIcon class="size-5" />
                <div class="absolute -top-1 -right-1 size-3 rounded-full bg-warning"></div>
              </button>
              
              <button 
                @click="handleSettings"
                class="btn btn-ghost btn-sm size-9 p-0"
                title="Settings"
              >
                <Cog6ToothIcon class="size-5" />
              </button>
            </div>

            <!-- User menu -->
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-sm px-2 gap-2">
                <div class="avatar">
                  <div class="size-6 rounded-full bg-gradient-to-br from-accent to-secondary">
                    <div class="grid place-items-center size-full text-xs font-semibold text-white">
                      A
                    </div>
                  </div>
                </div>
                <span class="text-sm font-medium hidden sm:block">Admin</span>
              </div>
              <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-48">
                <li><a><div class="flex items-center gap-2"><SignalIcon class="size-4" />System Status</div></a></li>
                <div class="divider my-1"></div>
                <li><a class="text-error"><div class="flex items-center gap-2">Sign Out</div></a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="relative">
        <slot />
      </div>
    </main>
  </div>
</template>


