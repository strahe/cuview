<script setup lang="ts">
import { ref } from "vue";
import TabsContainer from "@/components/ui/TabsContainer.vue";
import OverviewTab from "./components/OverviewTab.vue";
import ActiveTasksTab from "./components/ActiveTasksTab.vue";
import HistoryTab from "./components/HistoryTab.vue";

const activeTab = ref("overview");

const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: "📊",
  },
  {
    id: "active",
    label: "Active Tasks",
    icon: "⚡",
  },
  {
    id: "history",
    label: "History",
    icon: "📜",
  },
];
</script>

<template>
  <div class="p-6">
    <!-- Tab Navigation and Content -->
    <TabsContainer v-model="activeTab" :tabs="tabs">
      <template #default="{ activeTab: currentTab }">
        <div v-show="currentTab === 'overview'">
          <OverviewTab />
        </div>
        <div v-show="currentTab === 'active'">
          <ActiveTasksTab />
        </div>
        <div v-show="currentTab === 'history'">
          <HistoryTab />
        </div>
      </template>
    </TabsContainer>
  </div>
</template>
