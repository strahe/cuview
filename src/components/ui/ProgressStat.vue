<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { computed } from 'vue'
import type { Component } from 'vue'

interface ProgressStatProps {
  label: string
  value: number
  max?: number
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
  icon?: Component
  showPercentage?: boolean
}

const props = withDefaults(defineProps<ProgressStatProps>(), {
  max: 100,
  color: 'primary',
  showPercentage: true
})

const progressColors = {
  primary: 'progress-primary',
  secondary: 'progress-secondary', 
  accent: 'progress-accent',
  info: 'progress-info',
  success: 'progress-success',
  warning: 'progress-warning',
  error: 'progress-error'
}

const percentage = computed(() => Math.round((props.value / props.max) * 100))
</script>

<template>
  <div class="rounded-lg border border-base-300 p-3">
    <div class="flex items-center justify-between text-sm mb-2">
      <span class="flex items-center gap-2">
        <component v-if="icon" :is="icon" class="size-4" />
        {{ label }}
      </span>
      <span v-if="showPercentage">{{ percentage }}%</span>
    </div>
    
    <!-- 使用 reka-ui Progress 提供语义化和可访问性 -->
    <ProgressRoot 
      :value="value" 
      :max="max"
      class="w-full"
    >
      <ProgressIndicator 
        class="progress w-full"
        :class="progressColors[color]"
        :value="value"
        :max="max"
      />
    </ProgressRoot>
  </div>
</template>