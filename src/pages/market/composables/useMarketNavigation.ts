import { computed } from "vue";
import { useRouter } from "vue-router";

export interface MarketTab {
  id: string;
  label: string;
  path: string;
}

export const MARKET_TABS: MarketTab[] = [
  { id: "balance", label: "Balance", path: "/market/balance" },
  { id: "asks", label: "Asks", path: "/market/asks" },
  { id: "mk12-deals", label: "MK12 Deals", path: "/market/mk12/deals" },
  { id: "mk20-deals", label: "MK20 Deals", path: "/market/mk20/deals" },
  { id: "settings", label: "Settings", path: "/market/settings" },
];

export function useMarketNavigation(currentTab: string) {
  const router = useRouter();
  const tabMap = new Map(MARKET_TABS.map((tab) => [tab.id, tab]));

  const activeTab = computed({
    get: () => currentTab,
    set: (newTab: string) => {
      const target = tabMap.get(newTab);
      if (target) {
        router.push(target.path);
      }
    },
  });

  return { tabs: MARKET_TABS, activeTab };
}
