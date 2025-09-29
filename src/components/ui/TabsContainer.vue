<script setup lang="ts">
import { ref, provide, watch } from "vue";

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface Props {
  tabs: Tab[];
  modelValue?: string;
}

interface Emits {
  (e: "update:modelValue", value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const activeTab = ref(props.modelValue || props.tabs[0]?.id);

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      activeTab.value = newValue;
    }
  },
);

watch(activeTab, (newTab) => {
  emit("update:modelValue", newTab);
});

provide("activeTab", activeTab);

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId;
};
</script>

<template>
  <div class="w-full">
    <!-- Tab Navigation -->
    <div class="mb-4">
      <!-- Elegant Tab Design -->
      <div
        class="bg-base-200/60 inline-flex items-center space-x-0.5 rounded-xl p-0.5 shadow-inner"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-300',
            activeTab === tab.id
              ? 'bg-neutral text-neutral-content shadow-neutral/30 hover:bg-neutral-focus scale-105 transform shadow-lg'
              : 'text-base-content/75 hover:text-base-content hover:bg-base-100 hover:shadow-sm',
          ]"
          @click="setActiveTab(tab.id)"
        >
          <span v-if="tab.icon" class="text-sm opacity-90">{{ tab.icon }}</span>
          <span class="tracking-wide whitespace-nowrap">{{ tab.label }}</span>

          <!-- Active indicator -->
          <div
            v-if="activeTab === tab.id"
            class="bg-neutral absolute inset-0 -z-10 rounded-lg"
          />
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div>
      <!-- eslint-disable-next-line vue/attribute-hyphenation -->
      <slot :activeTab="activeTab" />
    </div>
  </div>
</template>
