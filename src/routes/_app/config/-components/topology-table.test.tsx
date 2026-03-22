import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatBytes } from "@/utils/format";
import type { ConfigTopologyNodeView } from "../-module/types";
import { TopologyTable } from "./topology-table";

function buildTopologyNode(
  overrides: Partial<ConfigTopologyNodeView> = {},
): ConfigTopologyNodeView {
  return {
    id: "node-1",
    name: "Worker Alpha",
    layers: [],
    cpu: "64",
    gpu: "8",
    ...overrides,
  };
}

function getRow(name: string) {
  const row = screen.getByText(name).closest("tr");

  if (!row) {
    throw new Error(`Row not found for ${name}`);
  }

  return row;
}

describe("TopologyTable", () => {
  it("formats numeric RAM byte values with formatBytes", () => {
    const bytes = 16 * 1024 ** 3;

    render(
      <TopologyTable
        data={[
          buildTopologyNode({
            id: "numeric-ram",
            name: "Numeric RAM Node",
            ram: bytes,
          }),
        ]}
        loading={false}
      />,
    );

    expect(
      within(getRow("Numeric RAM Node")).getByText(formatBytes(bytes)),
    ).toBeInTheDocument();
  });

  it.each([
    "16GiB",
    "128 GiB",
  ])("renders preformatted RAM value %s as-is", (ram) => {
    render(
      <TopologyTable
        data={[
          buildTopologyNode({
            id: `preformatted-${ram}`,
            name: `Preformatted ${ram}`,
            ram,
          }),
        ]}
        loading={false}
      />,
    );

    expect(
      within(getRow(`Preformatted ${ram}`)).getByText(ram),
    ).toBeInTheDocument();
  });

  it("renders a dash for empty or missing RAM values", () => {
    render(
      <TopologyTable
        data={[
          buildTopologyNode({ id: "empty-ram", name: "Empty RAM", ram: "" }),
          buildTopologyNode({ id: "missing-ram", name: "Missing RAM" }),
        ]}
        loading={false}
      />,
    );

    expect(within(getRow("Empty RAM")).getByText("-")).toBeInTheDocument();
    expect(within(getRow("Missing RAM")).getByText("-")).toBeInTheDocument();
  });
});
