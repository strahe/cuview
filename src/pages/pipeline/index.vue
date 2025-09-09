<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
  // Redirect to PoRep pipeline as the default view
  router.replace("/pipeline/porep");
});
</script>

<template>
  <div class="flex items-center justify-center p-6">
    <div class="text-center">
      <span class="loading loading-spinner loading-lg"></span>
      <div class="text-base-content/60 mt-2 text-sm">Redirecting...</div>
    </div>
  </div>
</template>
