import {
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  Fragment,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableCommonProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchColumn?: string;
  pagination?: boolean;
  pageSize?: number;
  emptyMessage?: ReactNode;
  emptyState?: ReactNode;
  className?: string;
  meta?: object;
  getRowCanExpand?: (row: Row<TData>) => boolean;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
}

type DataTableInteractiveProps<TData> = {
  onRowClick: (row: TData) => void;
  getRowAriaLabel: (row: TData) => string;
  getRowCanClick?: (row: TData) => boolean;
};

type DataTableNonInteractiveProps = {
  onRowClick?: never;
  getRowAriaLabel?: never;
  getRowCanClick?: never;
};

type DataTableProps<TData, TValue> = DataTableCommonProps<TData, TValue> &
  (DataTableInteractiveProps<TData> | DataTableNonInteractiveProps);

const interactiveRowChildSelector = [
  "a",
  "button",
  "input",
  "label",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='menuitem']",
  "[role='menuitemcheckbox']",
  "[role='menuitemradio']",
  "[role='radio']",
  "[role='switch']",
  "[role='tab']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const isFromInteractiveRowChild = (
  target: EventTarget | null,
  currentTarget: HTMLTableRowElement,
) => {
  if (!(target instanceof Element)) return false;

  const interactiveElement = target.closest(interactiveRowChildSelector);
  return Boolean(
    interactiveElement &&
      interactiveElement !== currentTarget &&
      currentTarget.contains(interactiveElement),
  );
};

const handleInteractiveRowKeyDown = <TData,>(
  event: KeyboardEvent<HTMLTableRowElement>,
  row: TData,
  onRowClick: (row: TData) => void,
) => {
  if (event.target !== event.currentTarget) return;
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  if (event.repeat) return;

  onRowClick(row);
};

const handleInteractiveRowClick = <TData,>(
  event: MouseEvent<HTMLTableRowElement>,
  row: TData,
  onRowClick: (row: TData) => void,
) => {
  if (isFromInteractiveRowChild(event.target, event.currentTarget)) return;

  onRowClick(row);
};

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  searchColumn,
  pagination = true,
  pageSize = 20,
  onRowClick,
  getRowAriaLabel,
  getRowCanClick,
  emptyMessage = "No results.",
  emptyState,
  className,
  meta,
  getRowCanExpand,
  renderSubComponent,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    meta,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getRowCanExpand,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      expanded,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });
  const rows = table.getRowModel().rows;
  const hasRowClick = Boolean(onRowClick);

  if (loading) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={
              searchColumn
                ? ((table
                    .getColumn(searchColumn)
                    ?.getFilterValue() as string) ?? "")
                : globalFilter
            }
            onChange={(e) => {
              if (searchColumn) {
                table.getColumn(searchColumn)?.setFilterValue(e.target.value);
              } else {
                setGlobalFilter(e.target.value);
              }
            }}
            className="pl-9"
          />
        </div>
      )}

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() &&
                            "cursor-pointer select-none",
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="size-3" />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => {
                const isInteractiveRow =
                  hasRowClick && (getRowCanClick?.(row.original) ?? true);

                return (
                  <Fragment key={row.id}>
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      aria-label={
                        isInteractiveRow
                          ? getRowAriaLabel?.(row.original)
                          : undefined
                      }
                      className={cn(
                        isInteractiveRow &&
                          "cursor-pointer focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                      )}
                      onClick={
                        isInteractiveRow && onRowClick
                          ? (e) =>
                              handleInteractiveRowClick(
                                e,
                                row.original,
                                onRowClick,
                              )
                          : undefined
                      }
                      tabIndex={isInteractiveRow ? 0 : undefined}
                      onKeyDown={
                        isInteractiveRow && onRowClick
                          ? (e) =>
                              handleInteractiveRowKeyDown(
                                e,
                                row.original,
                                onRowClick,
                              )
                          : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && renderSubComponent && (
                      <TableRow key={`${row.id}-expanded`}>
                        <TableCell colSpan={row.getVisibleCells().length}>
                          {renderSubComponent({ row })}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyState ?? emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} row(s) total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
