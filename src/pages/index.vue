<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Auto redirect to overview
onMounted(() => {
  router.replace("/overview");
});
</script>

<template>
  <!-- Loading state while redirecting -->
  <div class="hero bg-base-200 min-h-screen">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
        <p class="text-lg">Loading Curio Overview...</p>
      </div>
    </div>
  </div>
</template>
