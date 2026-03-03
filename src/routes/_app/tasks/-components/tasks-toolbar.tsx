import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TaskResultFilter } from "../-module/types";

interface TasksToolbarProps {
  q: string;
  onQueryChange: (value: string) => void;
  result: TaskResultFilter;
  onResultChange?: (value: TaskResultFilter) => void;
  showBg?: boolean;
  onShowBgChange?: (value: boolean) => void;
  coalesce?: boolean;
  onCoalesceChange?: (value: boolean) => void;
  limit?: number;
  onLimitChange?: (value: number) => void;
  extraActions?: React.ReactNode;
  pageInfo?: string;
  onReset?: () => void;
  resetLabel?: string;
  minimal?: boolean;
  className?: string;
}

export function TasksToolbar({
  q,
  onQueryChange,
  result,
  onResultChange,
  showBg,
  onShowBgChange,
  coalesce,
  onCoalesceChange,
  limit,
  onLimitChange,
  extraActions,
  pageInfo,
  onReset,
  resetLabel = "Reset",
  minimal = false,
  className,
}: TasksToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        !minimal && "rounded border border-border/60 bg-muted/20 p-3",
        className,
      )}
    >
      <div className="min-w-[220px] flex-1">
        <Input
          value={q}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by task ID, type, owner, miner, error..."
        />
      </div>

      {onResultChange && (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Result</span>
          <select
            value={result}
            onChange={(event) =>
              onResultChange(event.target.value as TaskResultFilter)
            }
            className="h-9 rounded border border-border bg-background px-2 text-sm"
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </label>
      )}

      {typeof showBg === "boolean" && onShowBgChange && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showBg}
            onChange={(event) => onShowBgChange(event.target.checked)}
            className="size-4 rounded border-border accent-primary"
          />
          <span>Show background tasks</span>
        </label>
      )}

      {typeof coalesce === "boolean" && onCoalesceChange && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={coalesce}
            onChange={(event) => onCoalesceChange(event.target.checked)}
            className="size-4 rounded border-border accent-primary"
          />
          <span>Coalesce similar tasks</span>
        </label>
      )}

      {typeof limit === "number" && onLimitChange && (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Page Size</span>
          <select
            value={limit}
            onChange={(event) =>
              onLimitChange(Number.parseInt(event.target.value, 10))
            }
            className="h-9 rounded border border-border bg-background px-2 text-sm"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </label>
      )}

      {(pageInfo || onReset || extraActions) && (
        <div className="ml-auto flex items-center gap-2">
          {pageInfo ? (
            <span className="text-xs text-muted-foreground">{pageInfo}</span>
          ) : null}
          {onReset ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9"
            >
              {resetLabel}
            </Button>
          ) : null}
          {extraActions}
        </div>
      )}
    </div>
  );
}
