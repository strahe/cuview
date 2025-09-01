import { defineStore } from "pinia";
import { ref } from "vue";
import type {
  SortingState,
  GroupingState,
  ExpandedState,
} from "@tanstack/vue-table";

export const useTaskHistoryTableStore = defineStore(
  "taskHistoryTable",
  () => {
    const showAggregateInfo = ref(false);
    const searchQuery = ref("");
    const selectedGroupBy = ref("");
    const resultFilter = ref<"all" | "success" | "failed">("all");

    const sorting = ref<SortingState>([{ id: "Start", desc: true }]);
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

    const setResultFilter = (filter: "all" | "success" | "failed") => {
      resultFilter.value = filter;
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
      resultFilter.value = "all";
      sorting.value = [{ id: "Start", desc: true }];
      grouping.value = [];
      expanded.value = {};
    };

    return {
      showAggregateInfo,
      searchQuery,
      selectedGroupBy,
      resultFilter,
      sorting,
      grouping,
      expanded,

      setSorting,
      setGrouping,
      setExpanded,
      setShowAggregateInfo,
      setSearchQuery,
      setSelectedGroupBy,
      setResultFilter,
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
        "resultFilter",
        "sorting",
        "grouping",
        "expanded",
      ],
    },
  },
);
