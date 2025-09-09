<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import TabsContainer from "@/components/ui/TabsContainer.vue";
import { usePipelineNavigation } from "../composables/usePipelineNavigation";

interface Props {
  currentTab: string;
}

const props = defineProps<Props>();

const { tabs, activeTab } = usePipelineNavigation(props.currentTab);
</script>

<template>
  <div class="p-6">
    <TabsContainer v-model="activeTab" :tabs="tabs">
      <template #default>
        <slot />
      </template>
    </TabsContainer>
  </div>
</template>
