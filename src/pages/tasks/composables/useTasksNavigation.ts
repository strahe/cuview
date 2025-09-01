import { computed } from "vue";
import { useRouter } from "vue-router";

export interface TaskTab {
  id: string;
  label: string;
  icon: string;
}

export const TASK_TABS: TaskTab[] = [
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
