import { computed, type Ref } from "vue";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type Table,
  type SortingState,
  type Row,
  type Cell,
} from "@tanstack/vue-table";
import {
  useTableState,
  type TableStateConfig,
} from "@/composables/useTableState";
import { useTableHelpers } from "@/composables/useTableHelpers";

// Standard table configuration interface
export interface StandardTableConfig<T> {
  tableId: string;
  columns: ColumnDef<T>[];
  data: Ref<T[] | undefined>;
  defaultSorting?: SortingState;
  groupingOptions?: Array<{ value: string; label: string }>;
  getRowId?: (row: T) => string;
  customRowIdPrefix?: string;
  enableGrouping?: boolean;
  globalFilterFn?: string;
  autoResetExpanded?: boolean;
  autoResetPageIndex?: boolean;
}

// Standard table return interface
export interface StandardTableReturn<T> {
  // Core table instance
  table: Table<T>;

  // State management
  store: ReturnType<typeof useTableState>;

  // Helper functions
  helpers: {
    hasData: Ref<boolean>;
    totalItems: Ref<number>;
    groupCount: Ref<number>;
    hasActiveFilters: Ref<boolean>;
  };

  // Common event handlers
  handlers: {
    handleGroupByChange: (event: Event) => void;
    handleRowClick: (row: Row<T>) => void;
    handleCellRightClick: (cell: Cell<T, unknown>, event: MouseEvent) => void;
    getCellTooltip: (cell: Cell<T, unknown>) => string;
    clearAllFilters: () => void;
  };

  // State refs for direct access
  rawData: Ref<T[] | undefined>;
}

/**
 * Unified composable for standard table functionality
 * Eliminates code duplication across table components by providing
 * all common @tanstack/vue-table setup, state management, and handlers
 */
export function useStandardTable<T>(
  config: StandardTableConfig<T>,
): StandardTableReturn<T> {
  // Ensure data is properly reactive
  const rawData = config.data;

  // Initialize table state with configuration
  const stateConfig: TableStateConfig = {
    defaultSorting: config.defaultSorting || [],
  };

  const store = useTableState(config.tableId, stateConfig);

  // Create standardized table instance with all common configuration
  const table = useVueTable({
    get data() {
      return rawData.value || [];
    },
    columns: config.columns,
    getRowId:
      config.getRowId ||
      ((_row: T, index: number) =>
        `${config.customRowIdPrefix || "row"}-${index}`),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableGrouping: config.enableGrouping ?? true,
    autoResetExpanded: config.autoResetExpanded ?? false,
    autoResetPageIndex: config.autoResetPageIndex ?? false,
    // globalFilterFn: "includesString", // Use default filter function

    // Reactive state integration
    state: {
      get sorting() {
        return store.sorting;
      },
      get grouping() {
        return store.grouping;
      },
      get expanded() {
        return store.expanded;
      },
      get globalFilter() {
        return store.searchQuery;
      },
    },

    // State change handlers with standard patterns
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(store.sorting) : updater;
      store.setSorting(newSorting);
    },
    onGroupingChange: (updater) => {
      const newGrouping =
        typeof updater === "function" ? updater(store.grouping) : updater;
      store.setGrouping(newGrouping);
    },
    onExpandedChange: (updater) => {
      const newExpanded =
        typeof updater === "function" ? updater(store.expanded) : updater;
      store.setExpanded(newExpanded);
    },
    onGlobalFilterChange: (updater) => {
      const newValue =
        typeof updater === "function" ? updater(store.searchQuery) : updater;
      store.setSearchQuery(newValue || "");
    },
  });

  // Initialize table helpers - handle undefined data
  const { hasData, totalItems } = useTableHelpers(rawData as Ref<T[]>, table);

  // Group count computation - standard pattern from existing tables
  const groupCount = computed(() => {
    if (!store.selectedGroupBy || !rawData.value?.length) return 0;

    const groups = new Set();
    for (const row of rawData.value) {
      // Check if it's a display column with custom grouping value
      const column = config.columns.find(
        (col) => "id" in col && col.id === store.selectedGroupBy,
      );

      if (
        column &&
        "getGroupingValue" in column &&
        typeof column.getGroupingValue === "function"
      ) {
        // Use custom grouping value function
        groups.add(column.getGroupingValue(row));
      } else {
        // Use direct property access for accessor columns
        groups.add((row as Record<string, unknown>)[store.selectedGroupBy]);
      }
    }

    return groups.size;
  });

  // Check if any filters are active
  const hasActiveFilters = computed(() => {
    return (
      store.searchQuery.trim() !== "" ||
      store.selectedGroupBy !== "" ||
      table.getState().columnFilters.length > 0
    );
  });

  // Standard event handlers used across tables
  const handleGroupByChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    store.setSelectedGroupBy(target.value);
  };

  const handleRowClick = (row: Row<T>) => {
    if (row.getCanExpand()) {
      row.getToggleExpandedHandler()();
    }
    // Note: Individual row click logic for modals should be handled in components
  };

  const handleCellRightClick = (cell: Cell<T, unknown>, event: MouseEvent) => {
    event.preventDefault();
    const value = String(cell.getValue() || "");
    if (value && navigator.clipboard) {
      navigator.clipboard.writeText(value);
    }
  };

  const getCellTooltip = (cell: Cell<T, unknown>) => {
    if (cell.getIsGrouped()) {
      return `Click to ${cell.row.getIsExpanded() ? "collapse" : "expand"} group`;
    }
    return String(cell.getValue() || "");
  };

  const clearAllFilters = () => {
    store.setSearchQuery("");
    store.setSelectedGroupBy("");
    table.resetColumnFilters();
  };

  return {
    table,
    store,
    helpers: {
      hasData,
      totalItems,
      groupCount,
      hasActiveFilters,
    },
    handlers: {
      handleGroupByChange,
      handleRowClick,
      handleCellRightClick,
      getCellTooltip,
      clearAllFilters,
    },
    rawData,
  };
}

// Helper type for extracting table data type from configuration
export type TableDataType<T extends StandardTableConfig<unknown>> =
  T extends StandardTableConfig<infer U> ? U : never;

// Helper type for table instances
export type StandardTable<T> = StandardTableReturn<T>;
