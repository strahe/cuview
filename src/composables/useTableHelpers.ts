import { computed, type Ref } from "vue";
import type { Table } from "@tanstack/vue-table";

export function useTableHelpers<T>(rawData: Ref<T[] | null>, table: Table<T>) {
  const hasData = computed(
    () => Array.isArray(rawData.value) && rawData.value.length > 0,
  );

  const totalItems = computed(() => table.getFilteredRowModel().rows.length);

  return { hasData, totalItems };
}
