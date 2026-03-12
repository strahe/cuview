import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  StoragePathCapabilityFilter,
  StoragePathHealthFilter,
} from "../-module/types";

interface StoragePathsToolbarProps {
  q: string;
  capability: StoragePathCapabilityFilter;
  health: StoragePathHealthFilter;
  onQueryChange: (value: string) => void;
  onCapabilityChange: (value: StoragePathCapabilityFilter) => void;
  onHealthChange: (value: StoragePathHealthFilter) => void;
  onReset: () => void;
}

export function StoragePathsToolbar({
  q,
  capability,
  health,
  onQueryChange,
  onCapabilityChange,
  onHealthChange,
  onReset,
}: StoragePathsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-full sm:w-72 md:w-80">
        <Input
          value={q}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by storage ID, host, group, miner, type..."
          aria-label="Search storage paths"
          className="h-8"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Capability
        </span>
        <Select
          value={capability}
          onValueChange={(value) =>
            onCapabilityChange(value as StoragePathCapabilityFilter)
          }
        >
          <SelectTrigger size="sm" className="h-8 min-w-30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="seal">Seal only</SelectItem>
            <SelectItem value="store">Store only</SelectItem>
            <SelectItem value="both">Seal + Store</SelectItem>
            <SelectItem value="readonly">Read-only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Health
        </span>
        <Select
          value={health}
          onValueChange={(value) =>
            onHealthChange(value as StoragePathHealthFilter)
          }
        >
          <SelectTrigger size="sm" className="h-8 min-w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="ml-auto">
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
