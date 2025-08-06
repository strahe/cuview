<script setup lang="ts">
import type { Component } from 'vue'

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: Component
  iconColor?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
}

withDefaults(defineProps<KPICardProps>(), {
  change: '',
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
  <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1">
    <div class="card-body p-4">
      <div class="flex items-center justify-between">
        <div class="text-sm font-medium text-base-content/70">
          {{ title }}
        </div>
        <div 
          v-if="icon" 
          class="rounded-lg p-2"
          :class="iconBgColors[iconColor]"
        >
          <component :is="icon" class="size-4" />
        </div>
      </div>
      
      <div class="text-3xl font-bold tracking-tight text-base-content">
        {{ value }}
      </div>
      
      <div 
        v-if="change" 
        class="flex items-center gap-2 text-xs"
        :class="trendColors[trend]"
      >
        <span>{{ change }}</span>
      </div>
    </div>
  </div>
</template>