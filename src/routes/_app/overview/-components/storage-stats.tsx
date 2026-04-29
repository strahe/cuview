import { Link } from "@tanstack/react-router";
import { HardDrive } from "lucide-react";
import { ProgressStat } from "@/components/composed/progress-stat";
import { Skeleton } from "@/components/ui/skeleton";
import type { StorageUseStat } from "@/types/storage";
import { formatBytes } from "@/utils/format";
import {
  OverviewEmpty,
  OverviewList,
  OverviewSection,
  overviewActionClassName,
} from "./overview-section";

interface StorageStatsProps {
  data: StorageUseStat[];
  loading: boolean;
}

export function StorageStats({ data, loading }: StorageStatsProps) {
  if (loading) {
    return (
      <OverviewSection title="Storage" icon={HardDrive}>
        <OverviewList className="gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </OverviewList>
      </OverviewSection>
    );
  }

  if (!data.length) {
    return (
      <OverviewSection title="Storage" icon={HardDrive}>
        <OverviewEmpty>No storage data available</OverviewEmpty>
      </OverviewSection>
    );
  }

  return (
    <OverviewSection
      title="Storage"
      icon={HardDrive}
      action={
        <Link to="/storage" className={overviewActionClassName}>
          View all
        </Link>
      }
    >
      <OverviewList className="gap-3">
        {data.map((stat, i) => {
          const used = Math.max(stat.Capacity - stat.Available, 0);
          const usagePercent =
            stat.Capacity === 0 ? 0 : (used / stat.Capacity) * 100;

          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex justify-between gap-3 text-xs text-muted-foreground">
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
      </OverviewList>
    </OverviewSection>
  );
}
