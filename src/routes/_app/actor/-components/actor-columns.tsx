import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { ActorSummaryData } from "@/types/actor";
import { formatFilecoin } from "@/utils/filecoin";
import { formatPowerShort } from "../-module/adapters";
import { CopyButton } from "./copy-button";
import { DeadlineMiniBar } from "./deadline-mini-bar";

export const actorColumns: ColumnDef<ActorSummaryData>[] = [
  {
    accessorKey: "Address",
    header: "Address",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-1">
        <Link
          to="/actor/$id"
          params={{ id: row.original.Address }}
          className="block max-w-48 truncate font-mono text-xs text-primary hover:underline"
          title={row.original.Address}
        >
          {row.original.Address}
        </Link>
        <CopyButton value={row.original.Address} />
      </div>
    ),
  },
  {
    id: "deadlines",
    header: "Deadlines",
    cell: ({ row }) => (
      <div className="w-32">
        <DeadlineMiniBar deadlines={row.original.Deadlines} />
      </div>
    ),
  },
  {
    accessorKey: "QualityAdjustedPower",
    header: "QaP",
    cell: ({ row }) => formatPowerShort(row.original.QualityAdjustedPower),
  },
  {
    accessorKey: "ActorBalance",
    header: "Balance",
    cell: ({ row }) => formatFilecoin(row.original.ActorBalance),
  },
  {
    accessorKey: "ActorAvailable",
    header: "Available",
    cell: ({ row }) => formatFilecoin(row.original.ActorAvailable),
  },
  {
    accessorKey: "Win1",
    header: "Wins (1d)",
  },
  {
    accessorKey: "Win7",
    header: "Wins (7d)",
  },
  {
    accessorKey: "Win30",
    header: "Wins (30d)",
  },
  {
    id: "layers",
    header: "Layers",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.CLayers?.join(", ") || "—"}
      </span>
    ),
  },
];
