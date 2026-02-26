import { Link } from "@tanstack/react-router";
import { ArrowRightLeft } from "lucide-react";
import { SectionCard } from "@/components/composed/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PipelineWaterfallStats } from "@/types/pipeline";

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
      <SectionCard title="Pipeline Activity" icon={ArrowRightLeft}>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </SectionCard>
    );
  }

  const hasPoRep = porepStats && porepStats.Stages?.length > 0;
  const hasSnap = snapStats && snapStats.Stages?.length > 0;

  if (!hasPoRep && !hasSnap) {
    return (
      <SectionCard title="Pipeline Activity" icon={ArrowRightLeft}>
        <p className="text-sm text-muted-foreground">No pipeline activity</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Pipeline Activity"
      icon={ArrowRightLeft}
      action={
        <Link
          to="/pipeline/porep"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          View details →
        </Link>
      }
    >
      <div className="space-y-4">
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
      </div>
    </SectionCard>
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
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Link to={linkTo} className="text-sm font-medium hover:text-primary">
          {label}
        </Link>
        <span className="text-xs text-muted-foreground">
          Total: {stats.Total}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {stages.map((stage, i) => {
          const count = stage.Pending + stage.Running;
          const isFailed =
            stage.Name.toLowerCase() === "failed" ||
            stage.Name.toLowerCase() === "done";
          const isDone = stage.Name.toLowerCase() === "done";

          return (
            <div key={stage.Name} className="flex items-center gap-1">
              <div
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium",
                  isFailed && !isDone
                    ? "bg-destructive/10 text-destructive"
                    : isDone
                      ? "bg-success/10 text-success"
                      : count > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                )}
              >
                {stage.Name}
                <span className="ml-1 font-bold">{count}</span>
              </div>
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
