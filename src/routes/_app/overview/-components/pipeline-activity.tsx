import { Link } from "@tanstack/react-router";
import { ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PipelineWaterfallStats } from "@/types/pipeline";
import {
  OverviewEmpty,
  OverviewList,
  OverviewSection,
  overviewActionClassName,
} from "./overview-section";

interface PipelineActivityProps {
  porepStats: PipelineWaterfallStats | null;
  snapStats: PipelineWaterfallStats | null;
  loading: boolean;
}

export function PipelineActivity({
  porepStats,
  snapStats,
  loading,
}: PipelineActivityProps) {
  if (loading) {
    return (
      <OverviewSection title="Pipeline Activity" icon={ArrowRightLeft}>
        <OverviewList className="gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </OverviewList>
      </OverviewSection>
    );
  }

  const hasPoRep = porepStats && porepStats.Stages?.length > 0;
  const hasSnap = snapStats && snapStats.Stages?.length > 0;

  if (!hasPoRep && !hasSnap) {
    return (
      <OverviewSection title="Pipeline Activity" icon={ArrowRightLeft}>
        <OverviewEmpty>No pipeline activity</OverviewEmpty>
      </OverviewSection>
    );
  }

  return (
    <OverviewSection
      title="Pipeline Activity"
      icon={ArrowRightLeft}
      action={
        <Link to="/pipeline/porep" className={overviewActionClassName}>
          View details
        </Link>
      }
    >
      <OverviewList className="gap-4">
        {hasPoRep && (
          <PipelineFlow
            label="PoRep"
            stats={porepStats}
            linkTo="/pipeline/porep"
          />
        )}
        {hasSnap && (
          <PipelineFlow
            label="Snap"
            stats={snapStats}
            linkTo="/pipeline/snap"
          />
        )}
      </OverviewList>
    </OverviewSection>
  );
}

function PipelineFlow({
  label,
  stats,
  linkTo,
}: {
  label: string;
  stats: PipelineWaterfallStats;
  linkTo: string;
}) {
  const stages = stats.Stages ?? [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Link to={linkTo} className="text-sm font-medium hover:text-primary">
          {label}
        </Link>
        <span className="text-xs text-muted-foreground">
          Total: {stats.Total}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {stages.map((stage, i) => {
          const count = stage.Pending + stage.Running;
          const isFailed =
            stage.Name.toLowerCase() === "failed" ||
            stage.Name.toLowerCase() === "done";
          const isDone = stage.Name.toLowerCase() === "done";

          return (
            <div key={stage.Name} className="flex items-center gap-1">
              <Badge
                variant={
                  isFailed && !isDone
                    ? "destructive"
                    : count > 0
                      ? "default"
                      : "secondary"
                }
                className={cn(
                  isDone && "border-success/30 bg-success/10 text-success",
                  count === 0 && !isDone && "text-muted-foreground",
                )}
              >
                {stage.Name}
                <span className="font-semibold">{count}</span>
              </Badge>
              {i < stages.length - 1 && !isDone && (
                <span className="text-xs text-muted-foreground/50">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
