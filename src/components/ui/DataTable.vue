<script setup lang="ts">
interface Props {
  zebra?: boolean;
  fixed?: boolean;
  compact?: boolean;
}

withDefaults(defineProps<Props>(), {
  zebra: true,
  fixed: false,
  compact: false,
});
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
        },
      ]"
    >
      <slot />
    </table>
  </div>
</template>
