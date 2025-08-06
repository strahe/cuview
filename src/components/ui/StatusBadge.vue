<script setup lang="ts">
interface StatusBadgeProps {
  status: 'success' | 'info' | 'warning' | 'error'
  label: string
  size?: 'sm' | 'md' | 'lg'
  showIndicator?: boolean
}

withDefaults(defineProps<StatusBadgeProps>(), {
  size: 'sm',
  showIndicator: true
})

const statusConfig = {
  success: {
    badgeClass: 'badge-success',
    indicatorClass: 'bg-success'
  },
  info: {
    badgeClass: 'badge-info', 
    indicatorClass: 'bg-info'
  },
  warning: {
    badgeClass: 'badge-warning',
    indicatorClass: 'bg-warning'
  },
  error: {
    badgeClass: 'badge-error',
    indicatorClass: 'bg-error'
  }
}
</script>

<template>
  <div class="flex items-center gap-3">
    <span 
      v-if="showIndicator"
      class="size-2 rounded-full"
      :class="statusConfig[status].indicatorClass"
    />
    <div :class="`badge badge-${size} ${statusConfig[status].badgeClass}`">
      {{ label }}
    </div>
  </div>
</template>