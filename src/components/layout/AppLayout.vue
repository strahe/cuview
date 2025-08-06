<script setup lang="ts">
import { ref, computed } from 'vue'
import CollapsibleSidebar from './CollapsibleSidebar.vue'
import { 
  Bars3Icon
} from '@heroicons/vue/24/outline'

const mobileMenuOpen = ref(false)
const sidebarCollapsed = ref(false)

const mainContentMargin = computed(() => 
  sidebarCollapsed.value ? '4rem' : '16rem'
)

const handleSidebarToggle = (collapsed: boolean) => {
  sidebarCollapsed.value = collapsed
}
</script>

<template>
  <div class="flex min-h-screen bg-base-200/30">
    <!-- Desktop Collapsible Sidebar -->
    <div class="hidden lg:block fixed left-0 top-0 z-30">
      <CollapsibleSidebar @toggle="handleSidebarToggle" />
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
      <slot />
    </main>
  </div>
</template>


