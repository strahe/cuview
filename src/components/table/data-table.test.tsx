import type { ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable } from "./data-table";

interface RowData {
  name: string;
}

const columns: ColumnDef<RowData>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
];

describe("DataTable", () => {
  it("renders a custom empty state when no rows are available", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyState={<div>Nothing to inspect</div>}
      />,
    );

    expect(screen.getByText("Nothing to inspect")).toBeInTheDocument();
  });
});
