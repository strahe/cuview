import { Link2 } from "lucide-react";
import { SectionCard } from "@/components/composed/section-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SyncerStateItem } from "@/types/sync";

interface ChainConnectivityProps {
  data: SyncerStateItem[];
  loading: boolean;
}

export function ChainConnectivity({ data, loading }: ChainConnectivityProps) {
  if (loading) {
    return (
      <SectionCard title="Chain Endpoints" icon={Link2}>
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </SectionCard>
    );
  }

  if (!data.length) {
    return (
      <SectionCard title="Chain Endpoints" icon={Link2}>
        <p className="text-sm text-muted-foreground">
          No chain endpoints configured
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Chain Endpoints" icon={Link2}>
      <div className="space-y-1.5">
        {data.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
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
      </div>
    </SectionCard>
  );
}
