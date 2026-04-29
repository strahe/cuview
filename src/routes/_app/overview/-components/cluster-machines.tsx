import { Link } from "@tanstack/react-router";
import { Server } from "lucide-react";
import { StatusBadge } from "@/components/composed/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ClusterMachine } from "@/types/cluster";
import {
  OverviewEmpty,
  OverviewList,
  OverviewSection,
  overviewActionClassName,
} from "./overview-section";

interface ClusterMachinesProps {
  data: ClusterMachine[];
  loading: boolean;
}

export function ClusterMachines({ data, loading }: ClusterMachinesProps) {
  if (loading) {
    return (
      <OverviewSection title="Machines" icon={Server}>
        <OverviewList className="gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </OverviewList>
      </OverviewSection>
    );
  }

  if (!data.length) {
    return (
      <OverviewSection title="Machines" icon={Server}>
        <OverviewEmpty>No machines in cluster</OverviewEmpty>
      </OverviewSection>
    );
  }

  return (
    <OverviewSection
      title="Machines"
      icon={Server}
      action={
        <Link to="/machines" className={overviewActionClassName}>
          View all
        </Link>
      }
    >
      <OverviewList>
        {data.map((machine) => (
          <Link
            key={machine.ID}
            to="/machines/$id"
            params={{ id: String(machine.ID) }}
            className="flex items-center gap-3 rounded-md bg-background/40 px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
          >
            <StatusBadge
              status={machine.Unschedulable ? "warning" : "success"}
              label={machine.Unschedulable ? "Off" : "On"}
              className="w-10 justify-center text-[10px]"
            />
            <span className="min-w-0 flex-1 truncate font-medium">
              {machine.Address || `Machine #${machine.ID}`}
            </span>
            <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
              {machine.Cpu != null && (
                <MicroBar label="CPU" value={machine.Cpu} max={100} />
              )}
              {machine.RamHumanized && (
                <span className="w-16 text-right">{machine.RamHumanized}</span>
              )}
              <span className="w-8 text-right">
                {machine.RunningTasks ?? 0}t
              </span>
            </div>
          </Link>
        ))}
      </OverviewList>
    </OverviewSection>
  );
}

function MicroBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-1" title={`${label}: ${value}%`}>
      <span className="w-7 text-right">{label}</span>
      <div className="h-1.5 w-10 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            pct >= 90
              ? "bg-destructive"
              : pct >= 70
                ? "bg-warning"
                : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
