import type { ColumnDef } from "@tanstack/react-table";
import { Trophy } from "lucide-react";
import { useMemo } from "react";
import { DataTable } from "@/components/table/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WinStat } from "@/types/win";
import { TruncatedValue } from "./truncated-value";

const winColumns: ColumnDef<WinStat>[] = [
  { accessorKey: "Epoch", header: "Epoch" },
  {
    accessorKey: "Block",
    header: "Block",
    cell: ({ row }) => (
      <TruncatedValue value={row.original.Block} className="max-w-40" />
    ),
  },
  { accessorKey: "SubmittedAtStr", header: "Submitted" },
  { accessorKey: "IncludedStr", header: "Included" },
  { accessorKey: "ComputeTime", header: "Compute Time" },
  { accessorKey: "TaskSuccess", header: "Status" },
];

export function ActorWinsCard({ wins }: { wins: WinStat[] }) {
  const displayWins = useMemo(() => wins.slice(0, 50), [wins]);
  if (!displayWins.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-4" />
          Recent Wins ({wins.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={winColumns}
          data={displayWins}
          emptyMessage="No wins recorded"
        />
      </CardContent>
    </Card>
  );
}
