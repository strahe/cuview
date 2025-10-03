import { computed } from "vue";
import { useRouter } from "vue-router";

export interface MarketTab {
  id: string;
  label: string;
}

export const MARKET_TABS: MarketTab[] = [
  { id: "balance", label: "Balance" },
  { id: "asks", label: "Asks" },
  { id: "deals", label: "Deals" },
  { id: "settings", label: "Settings" },
];

export function useMarketNavigation(currentTab: string) {
  const router = useRouter();

  const activeTab = computed({
    get: () => currentTab,
    set: (newTab: string) => {
      router.push(`/market/${newTab}`);
    },
  });

  return { tabs: MARKET_TABS, activeTab };
}
