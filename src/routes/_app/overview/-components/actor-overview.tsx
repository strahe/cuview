import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ActorSummaryData } from "@/types/actor";
import {
  OverviewEmpty,
  OverviewList,
  OverviewSection,
  overviewActionClassName,
} from "./overview-section";

interface ActorOverviewProps {
  data: ActorSummaryData[];
  loading: boolean;
}

const actorSummaryTitle = "Actor Summary";

export function ActorOverview({ data, loading }: ActorOverviewProps) {
  if (loading) {
    return (
      <OverviewSection title={actorSummaryTitle}>
        <OverviewList className="gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </OverviewList>
      </OverviewSection>
    );
  }

  if (!data.length) {
    return (
      <OverviewSection title={actorSummaryTitle}>
        <OverviewEmpty>No actors registered</OverviewEmpty>
      </OverviewSection>
    );
  }

  return (
    <OverviewSection
      title={actorSummaryTitle}
      action={
        <Link to="/actor" className={overviewActionClassName}>
          View all
        </Link>
      }
    >
      <OverviewList className="gap-3">
        {data.map((actor) => (
          <div
            key={actor.Address}
            className="flex flex-col gap-2 rounded-md border border-border bg-background/40 p-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/actor/$id"
                params={{ id: actor.Address }}
                className="flex items-center gap-1.5 font-mono text-sm font-medium hover:text-primary"
              >
                {actor.Address}
                <ExternalLink className="size-3 text-muted-foreground" />
              </Link>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Balance:{" "}
                  <span className="font-medium text-foreground">
                    {formatFILShort(actor.ActorBalance)}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                QaP:{" "}
                <span className="font-medium text-foreground">
                  {formatPowerShort(actor.QualityAdjustedPower)}
                </span>
              </span>
              <span>
                Available:{" "}
                <span className="font-medium text-foreground">
                  {formatFILShort(actor.ActorAvailable)}
                </span>
              </span>
              <span>
                Wins:{" "}
                <span className="font-medium text-foreground">
                  {actor.Win1}
                </span>
                /
                <span className="text-muted-foreground">
                  {actor.Win7}/{actor.Win30}
                </span>
                <span className="ml-0.5 text-muted-foreground/60">
                  (1d/7d/30d)
                </span>
              </span>
            </div>

            {/* Deadline mini-bar */}
            {actor.Deadlines && actor.Deadlines.length > 0 && (
              <div>
                <DeadlineMiniBar deadlines={actor.Deadlines} />
              </div>
            )}
          </div>
        ))}
      </OverviewList>
    </OverviewSection>
  );
}

function DeadlineMiniBar({
  deadlines,
}: {
  deadlines: ActorSummaryData["Deadlines"];
}) {
  return (
    <div
      className="flex gap-px"
      title="48 deadlines: green=proven, orange=current, red=faulty"
    >
      {deadlines.map((d, i) => {
        let color = "bg-muted";
        if (d.Faulty || d.PartFaulty) {
          color = "bg-destructive";
        } else if (d.Current) {
          color = "bg-warning";
        } else if (d.Proven || d.PartitionsProven) {
          color = "bg-success";
        } else if (!d.Empty) {
          color = "bg-primary/40";
        }
        return (
          <div
            key={i}
            className={cn("h-2 flex-1 rounded-sm", color)}
            title={`Deadline ${i}${d.Current ? " (current)" : ""}${d.Faulty ? " (faulty)" : ""}${d.Proven ? " (proven)" : ""}`}
          />
        );
      })}
    </div>
  );
}

function formatPowerShort(bytes: string): string {
  try {
    const n = BigInt(bytes || "0");
    if (n === BigInt(0)) return "0 B";
    const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"];
    let val = Number(n);
    let unitIndex = 0;
    while (val >= 1024 && unitIndex < units.length - 1) {
      val /= 1024;
      unitIndex++;
    }
    return `${val.toFixed(val >= 100 ? 0 : 1)} ${units[unitIndex]}`;
  } catch {
    return "0 B";
  }
}

function formatFILShort(value: string): string {
  const num = Number.parseFloat(value || "0");
  if (Number.isNaN(num) || num === 0) return "0 FIL";
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K FIL`;
  if (num >= 1) return `${num.toFixed(2)} FIL`;
  return `${num.toFixed(4)} FIL`;
}
