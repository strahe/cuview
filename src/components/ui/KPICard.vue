<script setup lang="ts">
import type { Component } from 'vue'

interface KPICardProps {
  value: string | number
  label: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: Component
  iconColor?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
}

withDefaults(defineProps<KPICardProps>(), {
  subtitle: '',
  trend: 'neutral',
  iconColor: 'primary'
})

const trendColors = {
  up: 'text-success',
  down: 'text-error', 
  neutral: 'text-base-content/60'
}

const iconBgColors = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  accent: 'bg-accent/10 text-accent',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error'
}
</script>

<template>
  <div class="bg-base-100 border border-base-300 rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:border-primary/20">
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <div class="text-sm font-medium text-base-content/60 mb-1">
          {{ label }}
        </div>
        <div class="text-3xl font-bold text-base-content tracking-tight">
          {{ value }}
        </div>
      </div>
      
      <div 
        v-if="icon" 
        class="rounded-lg p-2.5 ml-3"
        :class="iconBgColors[iconColor]"
      >
        <component :is="icon" class="size-5" />
      </div>
    </div>
    
    <div 
      v-if="subtitle" 
      class="text-xs font-medium"
      :class="trendColors[trend]"
    >
      {{ subtitle }}
    </div>
  </div>
</template>