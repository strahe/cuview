<script setup lang="ts">
import { ref } from "vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline";

interface Emits {
  (e: "search", id: string): void;
}

const emit = defineEmits<Emits>();
const query = ref("");

const handleSubmit = () => {
  const value = query.value.trim();
  if (!value) return;
  emit("search", value);
};
</script>

<template>
  <form class="flex items-center gap-2" @submit.prevent="handleSubmit">
    <div class="input input-bordered flex flex-1 items-center gap-2">
      <MagnifyingGlassIcon class="text-base-content/60 size-4" />
      <input
        v-model="query"
        type="text"
        placeholder="Enter deal ID"
        class="w-full bg-transparent focus:outline-none"
      />
    </div>
    <button type="submit" class="btn btn-primary" :disabled="!query.trim()">
      Search
    </button>
  </form>
</template>
