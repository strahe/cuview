import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import type {
  SortingState,
  GroupingState,
  ExpandedState,
  ColumnFiltersState,
} from "@tanstack/vue-table";

export interface TableStateConfig {
  defaultSorting: SortingState;
  customFilters?: Record<string, unknown>;
  persistKeys?: string[];
  initialSearch?: string;
}

export function useTableState(tableId: string, config: TableStateConfig) {
  const store = defineStore(
    `table-${tableId}`,
    () => {
      // Core table state
      const showAggregateInfo = ref(false);
      const searchQuery = ref("");
      const selectedGroupBy = ref("");
      const sorting = ref<SortingState>(config.defaultSorting);
      const grouping = ref<GroupingState>([]);
      const expanded = ref<ExpandedState>({});
      const columnFilters = ref<ColumnFiltersState>([]);

      // Custom filter state
      const customFilters = reactive(config.customFilters || {});

      // Core methods
      const setSorting = (newSorting: SortingState) => {
        sorting.value = newSorting;
      };

      const setGrouping = (newGrouping: GroupingState) => {
        grouping.value = newGrouping;
        const [firstGroup] = newGrouping;
        selectedGroupBy.value = firstGroup ?? "";
      };

      const setExpanded = (newExpanded: ExpandedState) => {
        expanded.value = newExpanded;
      };

      const setColumnFilters = (newColumnFilters: ColumnFiltersState) => {
        columnFilters.value = newColumnFilters;
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

      const setCustomFilter = (key: string, value: unknown) => {
        customFilters[key] = value;
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
        sorting.value = config.defaultSorting;
        grouping.value = [];
        expanded.value = {};
        columnFilters.value = [];
        // Reset custom filters to initial values
        Object.keys(customFilters).forEach((key) => {
          customFilters[key] = config.customFilters?.[key];
        });
      };

      return {
        // State
        showAggregateInfo,
        searchQuery,
        selectedGroupBy,
        sorting,
        grouping,
        expanded,
        columnFilters,
        customFilters,

        // Methods
        setSorting,
        setGrouping,
        setExpanded,
        setColumnFilters,
        setShowAggregateInfo,
        setSearchQuery,
        setSelectedGroupBy,
        setCustomFilter,
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
          "columnFilters",
          "customFilters",
          ...(config.persistKeys || []),
        ],
      },
    },
  );

  const storeInstance = store();

  // Override persisted search query with initialSearch when provided
  // This ensures URL parameters take precedence over persisted state
  if (config.initialSearch) {
    storeInstance.setSearchQuery(config.initialSearch);
  }

  return storeInstance;
}
