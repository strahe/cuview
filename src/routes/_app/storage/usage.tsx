import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Layers3, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  StoragePathInfo,
  StorageStoreStats,
  StorageUseStat,
} from "@/types/storage";
import { formatBytes } from "@/utils/format";
import {
  getStorageHighlightPaths,
  getStorageStoreTypeEmptyState,
  summarizeStorageOverview,
} from "./-module/filters";
import {
  useStoragePathsSummary,
  useStorageStoreTypeStats,
  useStorageUsage,
} from "./-module/queries";
import {
  DEFAULT_STORAGE_PATH_DETAIL_SEARCH,
  DEFAULT_STORAGE_PATHS_SEARCH,
} from "./-module/search-state";

export const Route = createFileRoute("/_app/storage/usage")({
  component: StorageUsagePage,
});

function StorageRoleCard({ stat }: { stat: StorageUseStat }) {
  const used = Math.max(stat.Capacity - stat.Available, 0);
  const usedPercent = stat.Capacity > 0 ? (used / stat.Capacity) * 100 : 0;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{stat.Type || "Unknown"}</p>
            <div className="flex flex-wrap gap-1">
              {stat.CanSeal ? (
                <Badge variant="outline" className="text-xs">
                  Seal
                </Badge>
              ) : null}
              {stat.CanStore ? (
                <Badge variant="outline" className="text-xs">
                  Store
                </Badge>
              ) : null}
            </div>
          </div>
          <p className="text-sm font-semibold">{usedPercent.toFixed(1)}%</p>
        </div>
        <Progress
          value={Math.min(usedPercent, 100)}
          className={cn(
            "mb-2",
            usedPercent > 90 &&
              "[&_[data-slot=progress-indicator]]:bg-destructive",
            usedPercent > 70 &&
              usedPercent <= 90 &&
              "[&_[data-slot=progress-indicator]]:bg-warning",
          )}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{stat.UseStr || formatBytes(used)} used</span>
          <span>{stat.CapStr || formatBytes(stat.Capacity)} total</span>
        </div>
      </CardContent>
    </Card>
  );
}

const highlightColumns: ColumnDef<StoragePathInfo>[] = [
  {
    accessorKey: "StorageID",
    header: "Storage ID",
    cell: ({ row }) => (
      <Link
        to="/storage/paths/$storageId"
        params={{ storageId: row.original.StorageID }}
        search={DEFAULT_STORAGE_PATH_DETAIL_SEARCH}
        className="font-mono text-xs text-primary hover:underline"
      >
        {row.original.StorageID}
      </Link>
    ),
  },
  {
    accessorKey: "PathType",
    header: "Role",
    cell: ({ row }) => <Badge variant="outline">{row.original.PathType}</Badge>,
  },
  {
    accessorKey: "UsedPercent",
    header: "Usage",
    cell: ({ row }) => `${row.original.UsedPercent.toFixed(1)}%`,
  },
  {
    accessorKey: "AvailableStr",
    header: "Available",
  },
  {
    accessorKey: "HealthStatus",
    header: "Health",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.HealthOK ? "done" : "failed"}
        label={row.original.HealthStatus}
      />
    ),
  },
];

function StoreTypeCard({ stat }: { stat: StorageStoreStats }) {
  const usedPercent = stat.capacity > 0 ? (stat.used / stat.capacity) * 100 : 0;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{stat.type}</p>
        <span className="text-xs text-muted-foreground">
          {usedPercent.toFixed(1)}%
        </span>
      </div>
      <p className="text-sm font-semibold">{stat.use_str}</p>
      <p className="text-xs text-muted-foreground">of {stat.cap_str}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {stat.avail_str} available
      </p>
    </div>
  );
}

function StorageUsagePage() {
  const usageQuery = useStorageUsage();
  const storeTypeQuery = useStorageStoreTypeStats();
  const pathsSummaryQuery = useStoragePathsSummary();

  const usageStats = usageQuery.data ?? [];
  const summaryPaths = pathsSummaryQuery.data ?? [];

  const overview = useMemo(
    () => summarizeStorageOverview(usageStats, summaryPaths),
    [summaryPaths, usageStats],
  );
  const highlightPaths = useMemo(
    () => getStorageHighlightPaths(summaryPaths, 6),
    [summaryPaths],
  );
  const storeTypeEmptyState = useMemo(
    () => getStorageStoreTypeEmptyState(summaryPaths),
    [summaryPaths],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KPICard label="Path Count" value={overview.totalPathCount} />
        <KPICard
          label="Total Capacity"
          value={formatBytes(overview.totalCapacity)}
        />
        <KPICard
          label="Available"
          value={formatBytes(overview.totalAvailable)}
        />
        <KPICard
          label="Used"
          value={formatBytes(overview.totalUsed)}
          subtitle={`${overview.usedPercent.toFixed(1)}%`}
        />
        <KPICard label="Unhealthy Paths" value={overview.degradedPaths} />
      </div>

      {overview.degradedPaths > 0 ? (
        <Alert variant="destructive">
          <ShieldAlert />
          <AlertTitle>Storage attention required</AlertTitle>
          <AlertDescription>
            {overview.degradedPaths} paths are reporting stale heartbeats or URL
            health issues. Inspect the affected paths before they impact sector
            placement or GC execution.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Role Usage</CardTitle>
          </div>
          <Link
            to="/storage/paths"
            search={DEFAULT_STORAGE_PATHS_SEARCH}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all paths →
          </Link>
        </CardHeader>
        <CardContent>
          {usageQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-36" />
              ))}
            </div>
          ) : usageStats.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {usageStats.map((stat) => (
                <StorageRoleCard key={stat.Type} stat={stat} />
              ))}
            </div>
          ) : (
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyTitle>No storage usage data</EmptyTitle>
                <EmptyDescription>
                  Storage usage will appear after Curio reports path capacity.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers3 className="size-4" />
            Store Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {storeTypeQuery.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28" />
              ))}
            </div>
          ) : storeTypeQuery.data && storeTypeQuery.data.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {storeTypeQuery.data.map((stat) => (
                <StoreTypeCard key={stat.type} stat={stat} />
              ))}
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-muted/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{storeTypeEmptyState.title}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {storeTypeEmptyState.hint}
                  </span>
                </div>
                <Link to="/storage/paths" search={DEFAULT_STORAGE_PATHS_SEARCH}>
                  <Button variant="outline" size="sm">
                    Review paths
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Store Paths
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {storeTypeEmptyState.storeCapablePaths}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Policy Buckets
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {storeTypeEmptyState.policyBucketCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Capacity
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatBytes(storeTypeEmptyState.totalCapacity)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Available
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatBytes(storeTypeEmptyState.totalAvailable)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4" />
            Path Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={highlightColumns}
            data={highlightPaths}
            loading={pathsSummaryQuery.isLoading}
            pagination={false}
            emptyMessage="No storage path highlights available."
          />
        </CardContent>
      </Card>
    </div>
  );
}
