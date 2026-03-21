import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { unwrapSqlNullableNumber } from "@/utils/sql";
import type { PsQueueItem } from "../-module/types";

interface ProviderQueueCardProps {
  queue: PsQueueItem[];
  loading: boolean;
  headerAction?: React.ReactNode;
}

export function ProviderQueueCard({
  queue,
  loading,
  headerAction,
}: ProviderQueueCardProps) {
  const columns = useMemo<ColumnDef<PsQueueItem>[]>(
    () => [
      {
        accessorKey: "service_id",
        header: "Service",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.service_id.slice(0, 12)}…
          </span>
        ),
      },
      {
        accessorKey: "obtained_at",
        header: "Obtained",
      },
      {
        id: "compute",
        header: "Compute",
        cell: ({ row }) => {
          const taskId = unwrapSqlNullableNumber(row.original.compute_task_id);
          return (
            <StatusBadge
              status={
                row.original.compute_done
                  ? "done"
                  : taskId !== null
                    ? "running"
                    : "pending"
              }
              label={
                row.original.compute_done
                  ? "Done"
                  : taskId !== null
                    ? `Task #${taskId}`
                    : "Waiting"
              }
            />
          );
        },
      },
      {
        id: "submit",
        header: "Submit",
        cell: ({ row }) => {
          const taskId = unwrapSqlNullableNumber(row.original.submit_task_id);
          return (
            <StatusBadge
              status={
                row.original.submit_done
                  ? "done"
                  : taskId !== null
                    ? "running"
                    : "pending"
              }
              label={
                row.original.submit_done
                  ? "Done"
                  : taskId !== null
                    ? `Task #${taskId}`
                    : "Waiting"
              }
            />
          );
        },
      },
      {
        id: "pow",
        header: "PoW",
        cell: ({ row }) =>
          row.original.was_pow ? (
            <StatusBadge status="info" label="Yes" />
          ) : (
            "—"
          ),
      },
      { accessorKey: "payment_amount", header: "Payment" },
    ],
    [],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Provider Queue</CardTitle>
        {headerAction}
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={queue}
          loading={loading}
          emptyMessage="Queue empty"
        />
      </CardContent>
    </Card>
  );
}
