import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFilecoin } from "@/utils/filecoin";
import { usePsClientRemove } from "../-module/queries";
import type { PsClientSettings } from "../-module/types";

interface ClientSettingsActionsCellProps {
  removeMutation: ReturnType<typeof usePsClientRemove>;
  spId: number;
}

function ClientSettingsActionsCell({
  removeMutation,
  spId,
}: ClientSettingsActionsCellProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (confirmRemove) {
    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="destructive"
          onClick={() =>
            removeMutation.mutate([spId], {
              onSuccess: () => {
                setConfirmRemove(false);
              },
            })
          }
          disabled={removeMutation.isPending}
        >
          Confirm
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirmRemove(false)}
          disabled={removeMutation.isPending}
        >
          ×
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setConfirmRemove(true)}
      disabled={removeMutation.isPending}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

interface ClientSettingsCardProps {
  clients: PsClientSettings[];
  loading: boolean;
  headerAction?: React.ReactNode;
}

export function ClientSettingsCard({
  clients,
  loading,
  headerAction,
}: ClientSettingsCardProps) {
  const removeMutation = usePsClientRemove();

  const columns = useMemo<ColumnDef<PsClientSettings>[]>(
    () => [
      {
        accessorKey: "address",
        header: "SP",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.address}</span>
        ),
      },
      {
        id: "enabled",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.enabled ? "done" : "warning"}
            label={row.original.enabled ? "Enabled" : "Disabled"}
          />
        ),
      },
      {
        id: "types",
        header: "Types",
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.do_porep && (
              <StatusBadge status="info" label="PoRep" />
            )}
            {row.original.do_snap && <StatusBadge status="info" label="Snap" />}
          </div>
        ),
      },
      {
        id: "price",
        header: "Price",
        cell: ({ row }) =>
          formatFilecoin(row.original.price).replace(/ FIL$/, " FIL/p"),
      },
      {
        accessorKey: "minimum_pending_seconds",
        header: "Min Pending (s)",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ClientSettingsActionsCell
            removeMutation={removeMutation}
            spId={row.original.sp_id}
          />
        ),
      },
    ],
    [removeMutation],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Client Settings</CardTitle>
        {headerAction}
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={clients}
          loading={loading}
          emptyMessage="No client settings"
        />
      </CardContent>
    </Card>
  );
}
