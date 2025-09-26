import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

export type IpniTabId = "overview" | "ads" | "entries" | "ops" | "settings";

interface IpniTab {
  id: IpniTabId;
  label: string;
}

const IPNI_TABS: IpniTab[] = [
  { id: "overview", label: "Overview" },
  { id: "ads", label: "Advertisements" },
  { id: "entries", label: "Entries" },
  { id: "ops", label: "Tasks & Ops" },
  { id: "settings", label: "Settings" },
];

const DEFAULT_TAB: IpniTabId = "overview";

const resolveTab = (raw: unknown): IpniTabId => {
  if (typeof raw !== "string") {
    return DEFAULT_TAB;
  }

  const normalized = raw.toLowerCase();
  const match = IPNI_TABS.find((tab) => tab.id === normalized);

  return match ? match.id : DEFAULT_TAB;
};

export const useIpniTabs = () => {
  const route = useRoute();
  const router = useRouter();

  const activeTab = ref<IpniTabId>(resolveTab(route.query.tab));

  watch(
    () => route.query.tab,
    (next) => {
      const normalized = resolveTab(next);
      if (normalized !== activeTab.value) {
        activeTab.value = normalized;
      }
    },
  );

  watch(activeTab, (next, prev) => {
    if (next === prev) {
      return;
    }

    const currentQuery = { ...route.query };
    const normalizedQueryTab = resolveTab(route.query.tab);
    if (normalizedQueryTab === next) {
      return;
    }

    if (next === DEFAULT_TAB) {
      delete currentQuery.tab;
    } else {
      currentQuery.tab = next;
    }

    // Remove tab-specific parameters when leaving their context
    if (next !== "ads") {
      delete currentQuery.ad;
    }

    if (next !== "entries") {
      delete currentQuery.entry;
    }

    router.replace({
      query: currentQuery,
    });
  });

  const tabs = computed(() => IPNI_TABS);

  const setTab = (tabId: IpniTabId) => {
    activeTab.value = resolveTab(tabId);
  };

  return {
    tabs,
    activeTab,
    setTab,
  };
};
