import { Link } from "@tanstack/react-router";
import { Bell, Clock, Globe, Radio, Users } from "lucide-react";
import { StatusBadge } from "@/components/composed/status-badge";
import { cn } from "@/lib/utils";
import type { SyncerStateItem } from "@/types/sync";

interface NetworkStatusStripProps {
  syncerState: SyncerStateItem[];
  epoch?: number;
  blockDelay?: number;
  peerCount?: number;
  alertPending: number;
}

export function NetworkStatusStrip({
  syncerState,
  epoch,
  blockDelay,
  peerCount,
  alertPending,
}: NetworkStatusStripProps) {
  const totalEndpoints = syncerState.length;
  const reachable = syncerState.filter((s) => s.Reachable).length;
  const syncStatus: "success" | "warning" | "error" =
    totalEndpoints === 0
      ? "warning"
      : reachable === totalEndpoints
        ? "success"
        : reachable > 0
          ? "warning"
          : "error";

  const syncLabel =
    totalEndpoints === 0
      ? "No endpoints"
      : reachable === totalEndpoints
        ? "All synced"
        : `${reachable}/${totalEndpoints} synced`;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm">
      <div className="flex items-center gap-1.5">
        <Radio
          className={cn(
            "size-3.5",
            syncStatus === "success"
              ? "text-success"
              : syncStatus === "warning"
                ? "text-warning"
                : "text-destructive",
          )}
        />
        <span className="font-medium">{syncLabel}</span>
      </div>

      {epoch !== undefined && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Globe className="size-3.5" />
          <span>
            Epoch <span className="font-medium text-foreground">{epoch}</span>
          </span>
        </div>
      )}

      {blockDelay !== undefined && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-3.5" />
          <span>
            Delay{" "}
            <span className="font-medium text-foreground">{blockDelay}s</span>
          </span>
        </div>
      )}

      {peerCount !== undefined && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="size-3.5" />
          <span>
            Peers{" "}
            <span className="font-medium text-foreground">{peerCount}</span>
          </span>
        </div>
      )}

      <div className="ml-auto">
        {alertPending > 0 ? (
          <Link to="/alerts" className="flex items-center gap-1.5">
            <StatusBadge
              status="warning"
              label={`${alertPending} alert${alertPending > 1 ? "s" : ""}`}
              className="cursor-pointer"
            />
          </Link>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Bell className="size-3.5" />
            <span>No alerts</span>
          </div>
        )}
      </div>
    </div>
  );
}
