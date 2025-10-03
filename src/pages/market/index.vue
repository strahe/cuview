<route>
{
  "meta": {
    "title": "Market"
  }
}
</route>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
  router.replace("/market/balance");
});
</script>

<template>
  <div class="p-6">
    <div class="text-center">
      <div class="loading loading-spinner loading-lg"></div>
      <p class="text-base-content/70 mt-4">Loading...</p>
    </div>
  </div>
</template>
