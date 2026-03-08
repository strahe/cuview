import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PorepActorRow, SnapActorRow } from "../-module/types";

// ---------------------------------------------------------------------------
// PoRep actor columns
// ---------------------------------------------------------------------------

const porepActorColumns: ColumnDef<PorepActorRow>[] = [
  { accessorKey: "actor", header: "Actor" },
  { accessorKey: "countSDR", header: "SDR" },
  { accessorKey: "countTrees", header: "Trees" },
  { accessorKey: "countPrecommit", header: "PreCommit" },
  { accessorKey: "countWaitSeed", header: "WaitSeed" },
  { accessorKey: "countPoRep", header: "PoRep" },
  { accessorKey: "countCommit", header: "Commit" },
  { accessorKey: "countDone", header: "Done" },
  {
    accessorKey: "countFailed",
    header: "Failed",
    cell: ({ getValue }) => {
      const v = getValue<number>();
      return v || "—";
    },
  },
];

// ---------------------------------------------------------------------------
// Snap actor columns
// ---------------------------------------------------------------------------

const snapActorColumns: ColumnDef<SnapActorRow>[] = [
  { accessorKey: "actor", header: "Actor" },
  { accessorKey: "countEncode", header: "Encode" },
  { accessorKey: "countProve", header: "Prove" },
  { accessorKey: "countSubmit", header: "Submit" },
  { accessorKey: "countMoveStorage", header: "Move" },
  { accessorKey: "countDone", header: "Done" },
  {
    accessorKey: "countFailed",
    header: "Failed",
    cell: ({ getValue }) => {
      const v = getValue<number>();
      return v || "—";
    },
  },
];

// ---------------------------------------------------------------------------
// Shared actor summary table
// ---------------------------------------------------------------------------

interface ActorSummaryTableProps<T> {
  title: string;
  data: T[];
  variant: "porep" | "snap";
}

export function ActorSummaryTable<T extends PorepActorRow | SnapActorRow>({
  title,
  data,
  variant,
}: ActorSummaryTableProps<T>) {
  if (data.length === 0) return null;

  const columns =
    variant === "porep"
      ? (porepActorColumns as ColumnDef<T>[])
      : (snapActorColumns as ColumnDef<T>[]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={data} emptyMessage="No actor data" />
      </CardContent>
    </Card>
  );
}
