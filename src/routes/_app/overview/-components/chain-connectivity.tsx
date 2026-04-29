import { Link2 } from "lucide-react";
import { StatusBadge } from "@/components/composed/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SyncerStateItem } from "@/types/sync";
import {
  OverviewEmpty,
  OverviewList,
  OverviewSection,
} from "./overview-section";

interface ChainConnectivityProps {
  data: SyncerStateItem[];
  loading: boolean;
}

export function ChainConnectivity({ data, loading }: ChainConnectivityProps) {
  if (loading) {
    return (
      <OverviewSection title="Chain Endpoints" icon={Link2}>
        <OverviewList className="gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </OverviewList>
      </OverviewSection>
    );
  }

  if (!data.length) {
    return (
      <OverviewSection title="Chain Endpoints" icon={Link2}>
        <OverviewEmpty>No chain endpoints configured</OverviewEmpty>
      </OverviewSection>
    );
  }

  return (
    <OverviewSection title="Chain Endpoints" icon={Link2}>
      <OverviewList>
        {data.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 rounded-md bg-background/40 px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
          >
            <span className="min-w-0 flex-1 truncate font-mono text-xs">
              {item.Address || "Unknown"}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              {item.Reachable && item.SyncState && (
                <span className="text-xs text-muted-foreground">
                  {item.SyncState}
                </span>
              )}
              <StatusBadge
                status={item.Reachable ? "success" : "error"}
                label={item.Reachable ? "OK" : "Down"}
                className="text-[10px]"
              />
            </div>
          </div>
        ))}
      </OverviewList>
    </OverviewSection>
  );
}
