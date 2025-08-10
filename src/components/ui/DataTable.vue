<script setup lang="ts">
interface Props {
  zebra?: boolean
  fixed?: boolean
  hoverable?: boolean
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  zebra: true,
  fixed: false,
  hoverable: true,
  compact: false
})
</script>

<template>
  <div class="overflow-x-auto">
    <table
      :class="[
        'table',
        {
          'table-zebra': zebra,
          'table-fixed': fixed,
          'table-sm': compact,
          'table-hover': hoverable
        }
      ]"
    >
      <slot />
    </table>
  </div>
</template>

<style>
/* Simplified hover effects without layout changes */
.table-hover tbody tr {
  transition: background-color 0.2s ease, box-shadow 0.2s ease !important;
}

.table-hover tbody tr:hover {
  background-color: rgba(59, 130, 246, 0.08) !important;
  cursor: pointer !important;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3) !important;
}

/* Ensure all rows have hover effects including zebra stripes */
.table-hover.table-zebra tbody tr:nth-child(odd):hover,
.table-hover.table-zebra tbody tr:nth-child(even):hover {
  background-color: rgba(59, 130, 246, 0.08) !important;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3) !important;
}
</style>