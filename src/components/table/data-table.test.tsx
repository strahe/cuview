import type { ColumnDef } from "@tanstack/react-table";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "./data-table";

interface RowData {
  name: string;
  disabled?: boolean;
}

const columns: ColumnDef<RowData>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
];

const interactiveColumns: ColumnDef<RowData>[] = [
  ...columns,
  {
    id: "action",
    header: "Action",
    cell: () => <button type="button">Inner action</button>,
  },
];

const getRowByText = (text: string): HTMLTableRowElement => {
  const row = screen.getByText(text).closest("tr");
  if (!row) throw new Error(`Expected ${text} to be rendered inside a row`);
  return row;
};

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

  it("exposes clickable rows with native row focus semantics", () => {
    render(
      <DataTable
        columns={columns}
        data={[{ name: "Alice" }]}
        getRowAriaLabel={(row) => `Open ${row.name}`}
        onRowClick={() => undefined}
      />,
    );

    const row = getRowByText("Alice");

    expect(screen.queryByRole("button", { name: "Open Alice" })).toBeNull();
    expect(row).toHaveAttribute("aria-label", "Open Alice");
    expect(row).toHaveAttribute("tabIndex", "0");
    expect(row).toHaveClass(
      "cursor-pointer",
      "focus-visible:outline-solid",
      "focus-visible:outline-2",
      "focus-visible:outline-offset-[-2px]",
      "focus-visible:outline-ring",
    );
  });

  it("activates clickable rows from non-interactive cell clicks", () => {
    const onRowClick = vi.fn();

    render(
      <DataTable
        columns={columns}
        data={[{ name: "Alice" }]}
        getRowAriaLabel={(row) => `Open ${row.name}`}
        onRowClick={onRowClick}
      />,
    );

    fireEvent.click(screen.getByText("Alice"));

    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith({ name: "Alice" });
  });

  it("activates clickable rows with Enter and Space", () => {
    const onRowClick = vi.fn();

    render(
      <DataTable
        columns={columns}
        data={[{ name: "Alice" }]}
        getRowAriaLabel={(row) => `Open ${row.name}`}
        onRowClick={onRowClick}
      />,
    );

    const row = getRowByText("Alice");
    fireEvent.keyDown(row, { key: "Enter" });
    const spaceEvent = createEvent.keyDown(row, {
      key: " ",
      cancelable: true,
    });
    fireEvent(row, spaceEvent);

    expect(onRowClick).toHaveBeenCalledTimes(2);
    expect(onRowClick).toHaveBeenNthCalledWith(1, { name: "Alice" });
    expect(onRowClick).toHaveBeenNthCalledWith(2, { name: "Alice" });
    expect(spaceEvent.defaultPrevented).toBe(true);
  });

  it("ignores repeated row activation keys after preventing default", () => {
    const onRowClick = vi.fn();

    render(
      <DataTable
        columns={columns}
        data={[{ name: "Alice" }]}
        getRowAriaLabel={(row) => `Open ${row.name}`}
        onRowClick={onRowClick}
      />,
    );

    const row = getRowByText("Alice");
    const enterEvent = createEvent.keyDown(row, {
      key: "Enter",
      repeat: true,
      cancelable: true,
    });
    const spaceEvent = createEvent.keyDown(row, {
      key: " ",
      repeat: true,
      cancelable: true,
    });

    fireEvent(row, enterEvent);
    fireEvent(row, spaceEvent);

    expect(onRowClick).not.toHaveBeenCalled();
    expect(enterEvent.defaultPrevented).toBe(true);
    expect(spaceEvent.defaultPrevented).toBe(true);
  });

  it("does not activate clickable rows from child keyboard events", () => {
    const onRowClick = vi.fn();

    render(
      <DataTable
        columns={interactiveColumns}
        data={[{ name: "Alice" }]}
        getRowAriaLabel={(row) => `Open ${row.name}`}
        onRowClick={onRowClick}
      />,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "Inner action" }), {
      key: "Enter",
    });

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "button",
      cell: () => <button type="button">Inner action</button>,
      getTarget: () => screen.getByRole("button", { name: "Inner action" }),
    },
    {
      name: "label",
      cell: () => <label htmlFor="inner-option">Inner option</label>,
      getTarget: () => screen.getByText("Inner option"),
    },
    {
      name: "switch role",
      cell: () => (
        <span aria-checked="false" role="switch" tabIndex={-1}>
          Inner switch
        </span>
      ),
      getTarget: () => screen.getByRole("switch", { name: "Inner switch" }),
    },
  ])("does not activate clickable rows from interactive child clicks on $name", ({
    cell,
    getTarget,
  }) => {
    const onRowClick = vi.fn();

    render(
      <DataTable
        columns={[
          ...columns,
          {
            id: "action",
            header: "Action",
            cell,
          },
        ]}
        data={[{ name: "Alice" }]}
        getRowAriaLabel={(row) => `Open ${row.name}`}
        onRowClick={onRowClick}
      />,
    );

    fireEvent.click(getTarget());

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("leaves disabled clickable rows without row action semantics", () => {
    const onRowClick = vi.fn();

    render(
      <DataTable
        columns={columns}
        data={[{ name: "Alice", disabled: true }]}
        getRowAriaLabel={(row) => `Open ${row.name}`}
        getRowCanClick={(row) => !row.disabled}
        onRowClick={onRowClick}
      />,
    );

    const row = getRowByText("Alice");

    expect(screen.queryByRole("button", { name: "Open Alice" })).toBeNull();
    expect(row).not.toHaveAttribute("tabIndex");
    expect(row).not.toHaveClass("cursor-pointer");

    fireEvent.click(row!);
    fireEvent.keyDown(row!, { key: "Enter" });

    expect(onRowClick).not.toHaveBeenCalled();
  });
});
