import { Link } from "@tanstack/react-router";
import { HardDrive } from "lucide-react";
import { ProgressStat } from "@/components/composed/progress-stat";
import { SectionCard } from "@/components/composed/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StorageUseStat } from "@/types/storage";
import { formatBytes } from "@/utils/format";

interface StorageStatsProps {
  data: StorageUseStat[];
  loading: boolean;
}

export function StorageStats({ data, loading }: StorageStatsProps) {
  if (loading) {
    return (
      <SectionCard title="Storage" icon={HardDrive}>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      </SectionCard>
    );
  }

  if (!data.length) {
    return (
      <SectionCard title="Storage" icon={HardDrive}>
        <p className="text-sm text-muted-foreground">
          No storage data available
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Storage"
      icon={HardDrive}
      action={
        <Link
          to="/storage"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          View all →
        </Link>
      }
    >
      <div className="space-y-3">
        {data.map((stat, i) => {
          const used = Math.max(stat.Capacity - stat.Available, 0);
          const usagePercent =
            stat.Capacity === 0 ? 0 : (used / stat.Capacity) * 100;

          return (
            <div key={i}>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span className="font-mono">
                  {stat.Type || `Storage ${i + 1}`}
                </span>
                <span>
                  {formatBytes(used)} / {formatBytes(stat.Capacity)}
                </span>
              </div>
              <ProgressStat
                label=""
                value={Math.round(usagePercent)}
                max={100}
              />
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
