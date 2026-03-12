import {
  createFileRoute,
  Link,
  stripSearchParams,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StoragePathInfo } from "@/types/storage";
import { StoragePathsToolbar } from "../-components/storage-paths-toolbar";
import {
  filterStoragePaths,
  summarizeStoragePathInventory,
} from "../-module/filters";
import {
  getMachineIdForHost,
  normalizeStorageHost,
  useHostToMachineId,
  useStoragePaths,
} from "../-module/queries";
import {
  DEFAULT_STORAGE_PATH_DETAIL_SEARCH,
  DEFAULT_STORAGE_PATHS_SEARCH,
  normalizeStoragePathsSearch,
  patchStoragePathsSearch,
} from "../-module/search-state";
import type {
  StoragePathsSearchPatch,
  StoragePathsSearchState,
} from "../-module/types";

export const Route = createFileRoute("/_app/storage/paths/")({
  validateSearch: normalizeStoragePathsSearch,
  search: {
    middlewares: [
      stripSearchParams<StoragePathsSearchState>(DEFAULT_STORAGE_PATHS_SEARCH),
    ],
  },
  component: StoragePathsPage,
});

function renderRuleBadges(values: string[] | undefined, prefix: "+" | "-") {
  if (!values || values.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const visible = values.slice(0, 2);

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((value) => (
        <Badge
          key={`${prefix}-${value}`}
          variant={prefix === "+" ? "outline" : "destructive"}
          className="text-[11px]"
        >
          {prefix}
          {value}
        </Badge>
      ))}
      {values.length > visible.length ? (
        <Badge variant="secondary" className="text-[11px]">
          +{values.length - visible.length}
        </Badge>
      ) : null}
    </div>
  );
}

function StoragePathsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const pathsQuery = useStoragePaths();
  const paths = pathsQuery.data ?? [];

  const hosts = useMemo(
    () => paths.flatMap((path) => path.HostList ?? []),
    [paths],
  );
  const machineMapQuery = useHostToMachineId(hosts);
  const machineMap = machineMapQuery.data ?? {};

  const updateSearch = useCallback(
    (patch: StoragePathsSearchPatch) => {
      navigate({
        search: (prev) => patchStoragePathsSearch(prev, patch),
        replace: true,
      });
    },
    [navigate],
  );

  const filteredPaths = useMemo(
    () => filterStoragePaths(paths, search),
    [paths, search],
  );
  const summary = useMemo(() => summarizeStoragePathInventory(paths), [paths]);
  const detailSearch = useMemo(
    () => ({ ...DEFAULT_STORAGE_PATH_DETAIL_SEARCH, ...search }),
    [search],
  );

  const columns = useMemo<ColumnDef<StoragePathInfo>[]>(
    () => [
      {
        accessorKey: "StorageID",
        header: "Storage ID",
        cell: ({ row }) => (
          <Link
            to="/storage/paths/$storageId"
            params={{ storageId: row.original.StorageID }}
            search={detailSearch}
            onClick={(event) => event.stopPropagation()}
            className="font-mono text-xs text-primary hover:underline"
          >
            {row.original.StorageID}
          </Link>
        ),
      },
      {
        accessorKey: "PathType",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.PathType}</Badge>
        ),
      },
      {
        id: "hosts",
        header: "Hosts",
        cell: ({ row }) => {
          const hostsList = row.original.HostList ?? [];
          if (hostsList.length === 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {hostsList.slice(0, 2).map((host) => {
                const normalizedHost = normalizeStorageHost(host);
                const displayHost = normalizedHost || host;
                const machineId = getMachineIdForHost(machineMap, host);
                if (!machineId) {
                  return (
                    <Badge key={host} variant="secondary">
                      {displayHost}
                    </Badge>
                  );
                }

                return (
                  <Link
                    key={host}
                    to="/machines/$id"
                    params={{ id: String(machineId) }}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex"
                  >
                    <Badge variant="secondary">{displayHost}</Badge>
                  </Link>
                );
              })}
              {hostsList.length > 2 ? (
                <Badge variant="secondary">+{hostsList.length - 2}</Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "CapacityStr",
        header: "Capacity",
      },
      {
        accessorKey: "AvailableStr",
        header: "Available",
      },
      {
        accessorKey: "UsedPercent",
        header: "Usage",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
              <div
                className={
                  row.original.UsedPercent > 90
                    ? "h-full rounded-full bg-destructive"
                    : row.original.UsedPercent > 70
                      ? "h-full rounded-full bg-warning"
                      : "h-full rounded-full bg-primary"
                }
                style={{
                  width: `${Math.min(row.original.UsedPercent, 100)}%`,
                }}
              />
            </div>
            <span className="text-xs">
              {row.original.UsedPercent.toFixed(1)}%
            </span>
          </div>
        ),
      },
      {
        accessorKey: "ReservedStr",
        header: "Reserved",
        cell: ({ row }) => row.original.ReservedStr || "—",
      },
      {
        id: "typeRules",
        header: "Type Rules",
        cell: ({ row }) => {
          const allowRules = row.original.AllowTypesList ?? [];
          const denyRules = row.original.DenyTypesList ?? [];

          if (allowRules.length === 0 && denyRules.length === 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }

          return (
            <div className="space-y-1">
              {renderRuleBadges(allowRules, "+")}
              {renderRuleBadges(denyRules, "-")}
            </div>
          );
        },
      },
      {
        id: "minerRules",
        header: "Miner Rules",
        cell: ({ row }) => {
          const allowRules = row.original.AllowMinersList ?? [];
          const denyRules = row.original.DenyMinersList ?? [];

          if (allowRules.length === 0 && denyRules.length === 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }

          return (
            <div className="space-y-1">
              {renderRuleBadges(allowRules, "+")}
              {renderRuleBadges(denyRules, "-")}
            </div>
          );
        },
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
      {
        accessorKey: "LastHeartbeat",
        header: "Last Heartbeat",
        cell: ({ row }) =>
          row.original.LastHeartbeat
            ? new Date(row.original.LastHeartbeat).toLocaleString()
            : "—",
      },
    ],
    [detailSearch, machineMap],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KPICard label="Total" value={summary.totalPathCount} />
        <KPICard label="Healthy" value={summary.healthyPaths} />
        <KPICard label="Degraded" value={summary.degradedPaths} />
        <KPICard label="Store Capable" value={summary.storeCapablePaths} />
        <KPICard label="Read-only" value={summary.readOnlyPaths} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storage Paths</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <StoragePathsToolbar
              q={search.q}
              capability={search.capability}
              health={search.health}
              onQueryChange={(value) => updateSearch({ q: value })}
              onCapabilityChange={(value) =>
                updateSearch({ capability: value })
              }
              onHealthChange={(value) => updateSearch({ health: value })}
              onReset={() => updateSearch(DEFAULT_STORAGE_PATHS_SEARCH)}
            />
            <DataTable
              columns={columns}
              data={filteredPaths}
              loading={pathsQuery.isLoading}
              emptyMessage="No storage paths matched the current filters."
              onRowClick={(row) =>
                navigate({
                  to: "/storage/paths/$storageId",
                  params: { storageId: row.StorageID },
                  search: detailSearch,
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
