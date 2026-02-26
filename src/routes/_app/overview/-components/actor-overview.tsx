import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { SectionCard } from "@/components/composed/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ActorSummaryData } from "@/types/actor";

interface ActorOverviewProps {
  data: ActorSummaryData[];
  loading: boolean;
}

export function ActorOverview({ data, loading }: ActorOverviewProps) {
  if (loading) {
    return (
      <SectionCard title="Storage Providers">
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </SectionCard>
    );
  }

  if (!data.length) {
    return (
      <SectionCard title="Storage Providers">
        <p className="text-sm text-muted-foreground">No actors registered</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Storage Providers"
      action={
        <Link
          to="/actor"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          View all →
        </Link>
      }
    >
      <div className="space-y-3">
        {data.map((actor) => (
          <div
            key={actor.Address}
            className="rounded-md border border-border p-3"
          >
            <div className="flex items-center justify-between">
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

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
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
              <div className="mt-2">
                <DeadlineMiniBar deadlines={actor.Deadlines} />
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
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
