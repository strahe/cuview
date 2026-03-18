import type { ColumnDef } from "@tanstack/react-table";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRemovePdpService } from "../-module/queries";
import type { PdpService } from "../-module/types";
import { AddServiceDialog } from "./add-service-dialog";

interface ServicesCardProps {
  services: PdpService[];
  loading: boolean;
}

export function ServicesCard({ services, loading }: ServicesCardProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  const removeMutation = useRemovePdpService();

  const columns = useMemo<ColumnDef<PdpService>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Name" },
      {
        accessorKey: "pubkey",
        header: "Public Key",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.pubkey.slice(0, 24)}…
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const id = row.original.id;
          if (confirmRemoveId === id) {
            return (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    removeMutation.mutate([id], {
                      onSettled: () => setConfirmRemoveId(null),
                    });
                  }}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmRemoveId(null)}
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
              onClick={() => setConfirmRemoveId(id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          );
        },
      },
    ],
    [confirmRemoveId, removeMutation],
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" /> PDP Services
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="mr-1 size-4" /> Add Service
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={services}
            loading={loading}
            emptyMessage="No PDP services"
          />
        </CardContent>
      </Card>

      <AddServiceDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </>
  );
}
