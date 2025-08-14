<script setup lang="ts">
import { computed } from 'vue'
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
  ArrowsRightLeftIcon
} from '@heroicons/vue/24/outline'

interface NavItem {
  label: string
  icon: any
  active?: boolean
  to: string
}

const navItems: NavItem[] = [
  { 
    label: 'Overview', 
    icon: HomeIcon, 
    to: '/overview'
  },
  { 
    label: 'Tasks', 
    icon: WrenchScrewdriverIcon,
    to: '/tasks'
  },
  { 
    label: 'Machines', 
    icon: CpuChipIcon,
    to: '/machines'
  },
  { 
    label: 'Sectors', 
    icon: CircleStackIcon,
    to: '/sectors'
  },
  { 
    label: 'Storage', 
    icon: ServerStackIcon,
    to: '/storage'
  },
  { 
    label: 'Pipeline', 
    icon: ArrowsRightLeftIcon,
    to: '/pipeline'
  },
  { 
    label: 'Market', 
    icon: BuildingStorefrontIcon,
    to: '/market'
  },
  { 
    label: 'Actor', 
    icon: UserIcon,
    to: '/actor'
  },
  { 
    label: 'Wallet', 
    icon: WalletIcon,
    to: '/wallet'
  },
  { 
    label: 'IPNI', 
    icon: GlobeAltIcon,
    to: '/ipni'
  },
  { 
    label: 'Config', 
    icon: CogIcon,
    to: '/config'
  }
]

const { isCollapsed = false } = defineProps<{
  isCollapsed?: boolean
}>()

const sidebarClasses = computed(() => [
  'transition-all duration-300 ease-in-out bg-base-100 shadow-xl h-screen flex flex-col',
  isCollapsed ? 'w-16' : 'w-64'
])
</script>

<template>
  <aside :class="sidebarClasses">
    <div class="p-4 border-b border-base-300 h-20 flex flex-col justify-center">
      <div v-if="!isCollapsed" class="flex items-center gap-3">
        <div class="size-10 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-content grid place-items-center font-bold text-lg">
          C
        </div>
        <div>
          <h1 class="font-bold text-lg">Cuview</h1>
          <p class="text-xs text-base-content/60">Control Panel</p>
        </div>
      </div>
      
      <div v-else class="flex items-center justify-center">
        <div class="size-10 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-content grid place-items-center font-bold text-lg">
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
              class="flex items-center rounded-lg text-sm font-medium transition-all duration-200 hover:bg-base-200 group relative h-10"
              :class="[
                isCollapsed ? 'justify-center w-10 px-2' : 'px-3 gap-3'
              ]"
              active-class="bg-primary text-primary-content hover:bg-primary/90"
              :title="isCollapsed ? item.label : ''"
            >
              <component :is="item.icon" class="size-5 shrink-0" />
              
              <!-- Text container only when expanded -->
              <div v-if="!isCollapsed" class="flex-1 min-w-0 flex items-center">
                <Transition name="slide-left">
                  <span class="truncate">{{ item.label }}</span>
                </Transition>
              </div>
            </router-link>
            
            <Transition name="tooltip">
              <div 
                v-if="isCollapsed" 
                class="tooltip absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-neutral text-neutral-content text-xs rounded whitespace-nowrap z-50 shadow-lg"
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
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active, .slide-left-leave-active {
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


.tooltip-enter-active, .tooltip-leave-active {
  transition: opacity 0.2s ease;
}
.tooltip-enter-from, .tooltip-leave-to {
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