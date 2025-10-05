<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import type { IpniTabId } from "./composables/useIpniTabs";
import { useIpniTabs } from "./composables/useIpniTabs";
import TabsContainer from "@/components/ui/TabsContainer.vue";

const panelComponents: Record<
  IpniTabId,
  ReturnType<typeof defineAsyncComponent>
> = {
  overview: defineAsyncComponent(
    () => import("./components/IpniOverviewPanel.vue"),
  ),
  ads: defineAsyncComponent(() => import("./components/IpniAdsPanel.vue")),
  entries: defineAsyncComponent(
    () => import("./components/IpniEntriesPanel.vue"),
  ),
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
        <Suspense>
          <component :is="activeComponent" />
        </Suspense>
      </template>
    </TabsContainer>
  </div>
</template>
