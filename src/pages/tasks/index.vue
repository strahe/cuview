<route>
{
  "meta": {
    "title": "Tasks"
  }
}
</route>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Redirect to active tasks by default
onMounted(() => {
  router.replace("/tasks/active");
});
</script>

<template>
  <div class="p-6">
    <div class="text-center">
      <div class="loading loading-spinner loading-lg"></div>
      <p class="text-base-content/70 mt-4">Redirecting to active tasks...</p>
    </div>
  </div>
</template>
