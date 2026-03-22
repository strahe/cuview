import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/utils/format";
import type { ConfigTopologyNodeView } from "../-module/types";

function formatTopologyRam(ram: ConfigTopologyNodeView["ram"]): string {
  if (ram === undefined || ram === null) {
    return "-";
  }

  if (typeof ram === "number") {
    return formatBytes(ram);
  }

  const trimmedRam = ram.trim();

  if (!trimmedRam) {
    return "-";
  }

  const numericRam = Number(trimmedRam);

  return Number.isNaN(numericRam) ? trimmedRam : formatBytes(numericRam);
}

const topologyColumns: ColumnDef<ConfigTopologyNodeView>[] = [
  {
    accessorKey: "name",
    header: "Machine",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "cpu",
    header: "CPU",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.cpu || "-"}</span>
    ),
  },
  {
    accessorKey: "gpu",
    header: "GPU",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.gpu || "-"}</span>
    ),
  },
  {
    accessorKey: "ram",
    header: "RAM",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatTopologyRam(row.original.ram)}
      </span>
    ),
  },
  {
    id: "layers",
    header: "Layers",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.layers.map((layer) => (
          <Link
            key={layer}
            to="/config/editor"
            search={{ layer, mode: "visual", infoDisplay: "icon" }}
          >
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              {layer}
            </Badge>
          </Link>
        ))}
      </div>
    ),
  },
  {
    id: "layerCount",
    header: "Count",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.layers.length}</span>
    ),
    size: 80,
  },
];

interface TopologyTableProps {
  data: ConfigTopologyNodeView[];
  loading: boolean;
}

export function TopologyTable({ data, loading }: TopologyTableProps) {
  const columns = useMemo(() => topologyColumns, []);

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyMessage="No topology data available."
    />
  );
}
