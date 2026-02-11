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
      <SectionCard title="Chain Connectivity" icon={Link2}>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </SectionCard>
    );
  }

  if (!data.length) {
    return (
      <SectionCard title="Chain Connectivity" icon={Link2}>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          No chain endpoints configured
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Chain Connectivity" icon={Link2}>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border border-[hsl(var(--border))] px-3 py-2"
          >
            <span className="truncate text-sm font-mono">
              {item.Address || "Unknown"}
            </span>
            <StatusBadge
              status={item.Reachable ? "success" : "error"}
              label={item.Reachable ? "Connected" : "Unreachable"}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
