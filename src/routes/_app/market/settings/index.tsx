import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PricingFilter, ClientFilter, AllowDenyEntry } from "@/types/market";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/_app/market/settings/")({
  component: MarketSettingsPage,
});

const pricingColumns: ColumnDef<PricingFilter>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "min_dur", header: "Min Duration" },
  { accessorKey: "max_dur", header: "Max Duration" },
  { accessorKey: "min_size", header: "Min Size" },
  { accessorKey: "max_size", header: "Max Size" },
  { accessorKey: "price", header: "Price" },
  {
    id: "verified",
    header: "Verified",
    cell: ({ row }) => (row.original.verified ? "Yes" : "No"),
  },
];

const clientColumns: ColumnDef<ClientFilter>[] = [
  { accessorKey: "name", header: "Name" },
  {
    id: "active",
    header: "Active",
    cell: ({ row }) => (row.original.active ? "Yes" : "No"),
  },
  {
    id: "wallets",
    header: "Wallets",
    cell: ({ row }) => row.original.wallets?.length ?? 0,
  },
  { accessorKey: "max_deals_per_hour", header: "Max Deals/h" },
];

const allowDenyColumns: ColumnDef<AllowDenyEntry>[] = [
  {
    accessorKey: "wallet",
    header: "Wallet",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.wallet}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={
          row.original.status
            ? "text-[hsl(var(--success))]"
            : "text-[hsl(var(--destructive))]"
        }
      >
        {row.original.status ? "Allow" : "Deny"}
      </span>
    ),
  },
];

function MarketSettingsPage() {
  const { data: pricing, isLoading: pricingLoading } = useCurioRpc<
    PricingFilter[]
  >("GetPriceFilters", [], { refetchInterval: 60_000 });

  const { data: clients, isLoading: clientsLoading } = useCurioRpc<
    ClientFilter[]
  >("GetClientFilters", [], { refetchInterval: 60_000 });

  const { data: allowDeny, isLoading: allowDenyLoading } = useCurioRpc<
    AllowDenyEntry[]
  >("GetAllowDenyList", [], { refetchInterval: 60_000 });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pricing Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={pricingColumns}
            data={pricing ?? []}
            loading={pricingLoading}
            emptyMessage="No pricing filters"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={clientColumns}
            data={clients ?? []}
            loading={clientsLoading}
            emptyMessage="No client filters"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allow / Deny List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={allowDenyColumns}
            data={allowDeny ?? []}
            loading={allowDenyLoading}
            emptyMessage="No allow/deny entries"
          />
        </CardContent>
      </Card>
    </div>
  );
}
