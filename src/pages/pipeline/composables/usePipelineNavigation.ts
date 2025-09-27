import { computed } from "vue";
import { useRouter } from "vue-router";

export interface PipelineTab {
  id: string;
  label: string;
}

export const PIPELINE_TABS: PipelineTab[] = [
  {
    id: "porep",
    label: "PoRep Pipeline",
  },
  {
    id: "snap",
    label: "Snap Pipeline",
  },
];

export function usePipelineNavigation(currentTab: string) {
  const router = useRouter();

  const activeTab = computed({
    get: () => currentTab,
    set: (newTab: string) => {
      router.push(`/pipeline/${newTab}`);
    },
  });

  return {
    tabs: PIPELINE_TABS,
    activeTab,
  };
}
