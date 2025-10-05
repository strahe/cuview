import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

export type IpniTabId = "overview" | "ads" | "entries";

interface IpniTab {
  id: IpniTabId;
  label: string;
}

const IPNI_TABS: IpniTab[] = [
  { id: "overview", label: "Overview" },
  { id: "ads", label: "Advertisements" },
  { id: "entries", label: "Entries" },
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
    { immediate: true },
  );

  const syncQuery = (next: IpniTabId) => {
    const normalizedNext = resolveTab(next);
    const current = resolveTab(route.query.tab);

    if (normalizedNext === current) {
      return;
    }

    const nextQuery = { ...route.query };

    if (normalizedNext === DEFAULT_TAB) {
      delete nextQuery.tab;
    } else {
      nextQuery.tab = normalizedNext;
    }

    if (normalizedNext !== "ads") {
      delete nextQuery.ad;
    }

    if (normalizedNext !== "entries") {
      delete nextQuery.entry;
    }

    router.replace({ query: nextQuery });
  };

  watch(activeTab, (next, prev) => {
    if (next === prev) {
      return;
    }

    syncQuery(next);
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
