<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import type { IpniTabId } from "./composables/useIpniTabs";
import { useIpniTabs } from "./composables/useIpniTabs";
import TabsContainer from "@/components/ui/TabsContainer.vue";
import IpniOverviewPanel from "./components/IpniOverviewPanel.vue";
import IpniAdsPanel from "./components/IpniAdsPanel.vue";
import IpniEntriesPanel from "./components/IpniEntriesPanel.vue";

const panelComponents: Record<IpniTabId, Component> = {
  overview: IpniOverviewPanel,
  ads: IpniAdsPanel,
  entries: IpniEntriesPanel,
};

const { tabs, activeTab } = useIpniTabs();

const activeComponent = computed(() => panelComponents[activeTab.value]);
</script>

<route>
{
  "meta": {
    "title": "IPNI"
  }
}
</route>

<template>
  <div class="p-6">
    <TabsContainer v-model="activeTab" :tabs="tabs">
      <template #default>
        <component :is="activeComponent" />
      </template>
    </TabsContainer>
  </div>
</template>
