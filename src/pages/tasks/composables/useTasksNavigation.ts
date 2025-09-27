import { computed } from "vue";
import { useRouter } from "vue-router";

export interface TaskTab {
  id: string;
  label: string;
}

export const TASK_TABS: TaskTab[] = [
  {
    id: "overview",
    label: "Overview",
  },
  {
    id: "active",
    label: "Active Tasks",
  },
  {
    id: "history",
    label: "History",
  },
];

export function useTasksNavigation(currentTab: string) {
  const router = useRouter();

  const activeTab = computed({
    get: () => currentTab,
    set: (newTab: string) => {
      router.push(`/tasks/${newTab}`);
    },
  });

  return {
    tabs: TASK_TABS,
    activeTab,
  };
}
