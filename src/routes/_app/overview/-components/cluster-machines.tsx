import { Server } from "lucide-react";
import { SectionCard } from "@/components/composed/section-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClusterMachine } from "@/types/cluster";

interface ClusterMachinesProps {
  data: ClusterMachine[];
  loading: boolean;
}

export function ClusterMachines({ data, loading }: ClusterMachinesProps) {
  if (loading) {
    return (
      <SectionCard title="Cluster Machines" icon={Server}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </SectionCard>
    );
  }

  if (!data.length) {
    return (
      <SectionCard title="Cluster Machines" icon={Server}>
        <p className="text-sm text-muted-foreground">No machines in cluster</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Cluster Machines" icon={Server}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((machine) => (
          <div key={machine.ID} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="truncate text-sm font-medium">
                {machine.Address || `Machine #${machine.ID}`}
              </span>
              <StatusBadge
                status={machine.Unschedulable ? "warning" : "success"}
                label={machine.Unschedulable ? "Offline" : "Online"}
              />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span>Tasks: {machine.RunningTasks ?? 0}</span>
              {machine.Cpu != null && <span>CPU: {machine.Cpu}</span>}
              {machine.RamHumanized && <span>RAM: {machine.RamHumanized}</span>}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
