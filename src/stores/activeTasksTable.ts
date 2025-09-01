import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  SortingState,
  GroupingState,
  ExpandedState,
} from "@tanstack/vue-table";

export const useActiveTasksTableStore = defineStore(
  "activeTasksTable",
  () => {
    const showAggregateInfo = ref(false);
    const searchQuery = ref("");
    const selectedGroupBy = ref("");

    const sorting = ref<SortingState>([{ id: "SincePosted", desc: true }]);
    const grouping = ref<GroupingState>([]);
    const expanded = ref<ExpandedState>({});

    const setSorting = (newSorting: SortingState) => {
      sorting.value = newSorting;
    };

    const setGrouping = (newGrouping: GroupingState) => {
      grouping.value = newGrouping;
      selectedGroupBy.value = newGrouping.length > 0 ? newGrouping[0] : "";
    };

    const setExpanded = (newExpanded: ExpandedState) => {
      expanded.value = newExpanded;
    };

    const setShowAggregateInfo = (show: boolean) => {
      showAggregateInfo.value = show;
    };

    const setSearchQuery = (query: string) => {
      searchQuery.value = query;
    };

    const setSelectedGroupBy = (groupBy: string) => {
      selectedGroupBy.value = groupBy;
      if (groupBy) {
        grouping.value = [groupBy];
      } else {
        grouping.value = [];
      }
    };

    const toggleGrouping = (columnId: string) => {
      const currentGrouping = [...grouping.value];
      const isGrouped = currentGrouping.includes(columnId);

      if (isGrouped) {
        const newGrouping = currentGrouping.filter((id) => id !== columnId);
        setGrouping(newGrouping);
      } else {
        const newGrouping = [...currentGrouping, columnId];
        setGrouping(newGrouping);
      }
    };

    const removeGrouping = (columnId: string) => {
      const newGrouping = grouping.value.filter((id) => id !== columnId);
      setGrouping(newGrouping);
    };

    const resetState = () => {
      showAggregateInfo.value = false;
      searchQuery.value = "";
      selectedGroupBy.value = "";
      sorting.value = [{ id: "SincePosted", desc: true }];
      grouping.value = [];
      expanded.value = {};
    };

    return {
      showAggregateInfo,
      searchQuery,
      selectedGroupBy,
      sorting,
      grouping,
      expanded,

      setSorting,
      setGrouping,
      setExpanded,
      setShowAggregateInfo,
      setSearchQuery,
      setSelectedGroupBy,
      toggleGrouping,
      removeGrouping,
      resetState,
    };
  },
  {
    persist: {
      pick: [
        "showAggregateInfo",
        "searchQuery",
        "selectedGroupBy",
        "sorting",
        "grouping",
        "expanded",
      ],
    },
  },
);
