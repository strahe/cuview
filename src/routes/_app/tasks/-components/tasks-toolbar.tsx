import { useId } from "react";
import { Field, FieldLabel } from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const showBgId = useId();
  const coalesceId = useId();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        !minimal && "rounded-md border border-border/60 bg-muted/20 p-2",
        className,
      )}
    >
      <div className="w-full sm:w-72 md:w-80">
        <Input
          value={q}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by task ID, type, owner, miner, error..."
          aria-label="Search tasks"
          className="h-8"
        />
      </div>

      {onResultChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Result
          </span>
          <Select
            value={result}
            onValueChange={(value) => {
              if (value) onResultChange(value as TaskResultFilter);
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-8 min-w-24"
              aria-label="Result"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {typeof showBg === "boolean" && onShowBgChange && (
        <Field orientation="horizontal" className="w-auto">
          <Checkbox
            id={showBgId}
            checked={showBg}
            onCheckedChange={(checked) => onShowBgChange(Boolean(checked))}
          />
          <FieldLabel htmlFor={showBgId} className="font-normal leading-none">
            Show background tasks
          </FieldLabel>
        </Field>
      )}

      {typeof coalesce === "boolean" && onCoalesceChange && (
        <Field orientation="horizontal" className="w-auto">
          <Checkbox
            id={coalesceId}
            checked={coalesce}
            onCheckedChange={(checked) => onCoalesceChange(Boolean(checked))}
          />
          <FieldLabel htmlFor={coalesceId} className="font-normal leading-none">
            Coalesce similar tasks
          </FieldLabel>
        </Field>
      )}

      {typeof limit === "number" && onLimitChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Page Size
          </span>
          <Select
            value={String(limit)}
            onValueChange={(value) => {
              if (!value) return;
              onLimitChange(Number.parseInt(value, 10));
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-8 min-w-20"
              aria-label="Page Size"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {(pageInfo || onReset || extraActions) && (
        <div className="ml-auto flex items-center gap-1.5">
          {pageInfo ? (
            <span className="text-xs text-muted-foreground">{pageInfo}</span>
          ) : null}
          {onReset ? (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              {resetLabel}
            </Button>
          ) : null}
          {extraActions}
        </div>
      )}
    </div>
  );
}
