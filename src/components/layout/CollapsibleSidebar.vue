<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  HomeIcon,
  BoltIcon,
  ChartBarIcon,
  UsersIcon,
  CircleStackIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

interface NavItem {
  label: string
  icon: any
  active?: boolean
  href?: string
}

const navItems: NavItem[] = [
  { label: 'Overview', icon: HomeIcon, active: true, href: '#' },
  { label: 'Activity', icon: BoltIcon, href: '#' },
  { label: 'Analytics', icon: ChartBarIcon, href: '#' },
  { label: 'Users', icon: UsersIcon, href: '#' },
  { label: 'Database', icon: CircleStackIcon, href: '#' },
  { label: 'Settings', icon: CogIcon, href: '#' },
]

const emit = defineEmits<{
  toggle: [collapsed: boolean]
}>()

const isCollapsed = ref(false)

const sidebarClasses = computed(() => [
  'transition-all duration-300 ease-in-out bg-base-100 shadow-xl h-screen flex flex-col',
  isCollapsed.value ? 'w-16' : 'w-64'
])

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('toggle', isCollapsed.value)
}
</script>

<template>
  <aside :class="sidebarClasses">
    <div class="p-4 border-b border-base-300">
      <div v-if="!isCollapsed" class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-content grid place-items-center font-bold text-lg">
            C
          </div>
          <div>
            <h1 class="font-bold text-lg">Cuview</h1>
            <p class="text-xs text-base-content/60">Control Panel</p>
          </div>
        </div>
        
        <button 
          @click="toggleCollapse"
          class="btn btn-ghost btn-sm shrink-0"
        >
          <ChevronLeftIcon class="size-5" />
        </button>
      </div>
      
      <div v-else class="flex flex-col items-center gap-3">
        <div class="size-10 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-content grid place-items-center font-bold text-lg">
          C
        </div>
        
        <button 
          @click="toggleCollapse"
          class="btn btn-ghost btn-sm btn-circle"
        >
          <ChevronRightIcon class="size-5" />
        </button>
      </div>
    </div>

    <nav class="flex-1 p-4">
      <div class="space-y-1">
        <Transition name="fade">
          <div 
            v-if="!isCollapsed" 
            class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3 px-3"
          >
            Navigation
          </div>
        </Transition>
        
        <template v-for="item in navItems" :key="item.label">
          <div class="relative">
            <a 
              :href="item.href" 
              class="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-base-200 group relative"
              :class="[
                item.active ? 'bg-primary text-primary-content hover:bg-primary/90' : 'text-base-content/80 hover:text-base-content',
                isCollapsed ? 'justify-center gap-0' : 'gap-3'
              ]"
              :title="isCollapsed ? item.label : ''"
            >
              <component :is="item.icon" class="size-5 shrink-0" />
              
              <Transition name="slide-left">
                <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
              </Transition>
            </a>
            
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

    <div class="p-4 border-t border-base-300">
      <div class="flex items-center gap-3">
        <div class="avatar">
          <div class="size-8 rounded-full bg-gradient-to-br from-accent to-secondary">
            <div class="grid place-items-center size-full text-xs font-semibold text-white">
              U
            </div>
          </div>
        </div>
        
        <Transition name="slide-left">
          <div v-if="!isCollapsed" class="flex-1 min-w-0">
            <p class="text-sm font-medium text-base-content truncate">Admin User</p>
            <p class="text-xs text-base-content/60">admin@cuview.com</p>
          </div>
        </Transition>
      </div>
    </div>
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