import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StorageGcToolbarProps {
  disabled?: boolean;
  miner: string;
  sectorNum: number | null;
  limit: number;
  pageInfo: string;
  hasPrev: boolean;
  hasNext: boolean;
  onMinerChange: (value: string) => void;
  onSectorNumChange: (value: number | null) => void;
  onLimitChange: (value: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  actions?: React.ReactNode;
}

export function StorageGcToolbar({
  disabled = false,
  miner,
  sectorNum,
  limit,
  pageInfo,
  hasPrev,
  hasNext,
  onMinerChange,
  onSectorNumChange,
  onLimitChange,
  onPrev,
  onNext,
  onReset,
  actions,
}: StorageGcToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-full sm:w-48">
        <Input
          value={miner}
          disabled={disabled}
          onChange={(event) => onMinerChange(event.target.value)}
          placeholder="Miner, e.g. f01234"
          aria-label="Filter by miner"
          className="h-8"
        />
      </div>

      <div className="w-full sm:w-40">
        <Input
          type="number"
          value={sectorNum ?? ""}
          disabled={disabled}
          onChange={(event) => {
            const value = event.target.value.trim();
            onSectorNumChange(value ? Number.parseInt(value, 10) : null);
          }}
          placeholder="Sector number"
          aria-label="Filter by sector number"
          className="h-8"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Page Size
        </span>
        <Select
          value={String(limit)}
          onValueChange={(value) =>
            !disabled &&
            onLimitChange(Number.parseInt(value ?? String(limit), 10))
          }
        >
          <SelectTrigger size="sm" className="h-8 min-w-20" disabled={disabled}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{pageInfo}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !hasPrev}
          onClick={onPrev}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !hasNext}
          onClick={onNext}
        >
          Next
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onReset}
        >
          Reset
        </Button>
        {actions}
      </div>
    </div>
  );
}
