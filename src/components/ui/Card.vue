<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  description?: string
  icon?: any
  loading?: boolean
  error?: boolean
  errorMessage?: string
  variant?: 'default' | 'compact' | 'bordered' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  class?: string
  headerClass?: string
  bodyClass?: string
  collapsible?: boolean
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  loading: false,
  error: false,
  collapsible: false,
  collapsed: false
})

const emit = defineEmits<{
  'toggle-collapse': [collapsed: boolean]
}>()

const cardClasses = computed(() => [
  'card transition-all duration-200',
  {
    // Variants
    'bg-base-100 shadow-xl': props.variant === 'default',
    'card-bordered': props.variant === 'bordered',
    'bg-transparent shadow-none': props.variant === 'ghost',
    
    // Sizes
    'card-compact': props.size === 'sm',
    'card-normal': props.size === 'md',
    'card-lg': props.size === 'lg',
    
    // States
    'border-error': props.error,
    'opacity-75': props.loading
  },
  props.class
])

const headerClasses = computed(() => [
  'card-header',
  {
    'pb-2': props.variant === 'compact',
    'border-b border-base-300': props.collapsible
  },
  props.headerClass
])

const bodyClasses = computed(() => [
  'card-body',
  {
    'pt-0': props.variant === 'compact',
    'hidden': props.collapsible && props.collapsed
  },
  props.bodyClass
])

const toggleCollapse = () => {
  if (props.collapsible) {
    emit('toggle-collapse', !props.collapsed)
  }
}
</script>

<template>
  <div :class="cardClasses">
    <div v-if="title || icon || loading || error || $slots.header || collapsible" :class="headerClasses">
      <div v-if="$slots.header">
        <!-- Custom header slot -->
        <slot name="header" />
      </div>
      <div v-else class="flex items-center justify-between">
        <div class="card-title flex items-center gap-2">
          <!-- Error indicator -->
          <div v-if="error" class="text-error" title="Error">
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <!-- Icon -->
          <component v-else-if="icon" :is="icon" class="size-5 shrink-0" />
          
          <!-- Title -->
          <span v-if="title" :class="{ 'text-error': error }">{{ title }}</span>
          
          <!-- Loading indicator -->
          <div v-if="loading && !error" class="loading loading-spinner loading-sm ml-2"></div>
        </div>
        
        <div class="flex items-center gap-2">
          <!-- Extra actions slot -->
          <div v-if="$slots.actions">
            <slot name="actions" />
          </div>
          
          <!-- Collapse toggle -->
          <button 
            v-if="collapsible" 
            @click="toggleCollapse"
            class="btn btn-ghost btn-sm btn-circle"
            :title="collapsed ? 'Expand' : 'Collapse'"
          >
            <svg 
              class="size-4 transition-transform duration-200" 
              :class="{ 'rotate-180': collapsed }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Description -->
      <p v-if="description && !collapsed" class="text-base-content/70 mt-1" :class="{ 'text-error/70': error }">
        {{ errorMessage || description }}
      </p>
    </div>

    <div :class="bodyClasses">
      <!-- Error state -->
      <div v-if="error && !$slots.error" class="text-center py-8 text-error">
        <div class="text-lg mb-2">⚠️ Error</div>
        <div class="text-sm">{{ errorMessage || 'Something went wrong' }}</div>
      </div>
      
      <!-- Custom error slot -->
      <div v-else-if="error && $slots.error">
        <slot name="error" />
      </div>
      
      <!-- Loading state -->
      <div v-else-if="loading && !$slots.loading" class="text-center py-8">
        <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
        <div class="text-base-content/60">Loading...</div>
      </div>
      
      <!-- Custom loading slot -->
      <div v-else-if="loading && $slots.loading">
        <slot name="loading" />
      </div>
      
      <!-- Main content -->
      <div v-else>
        <slot />
      </div>
    </div>
    
    <!-- Footer slot -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>