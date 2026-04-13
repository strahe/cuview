import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MachineSummary } from "@/types/machine";

const navigateMock = vi.fn();
const refetchMock = vi.fn();
const useCurioRpcMock = vi.fn();
const useCurioRpcMutationMock = vi.fn();
const cordonMutateMock = vi.fn();
const uncordonMutateMock = vi.fn();
const restartMutateMock = vi.fn();

const machinesFixture: MachineSummary[] = [
  {
    Address: "10.0.0.1:4701",
    ID: 1,
    Name: "worker-online",
    SinceContact: "20s",
    Tasks: "SealSDR",
    Cpu: 8,
    RamHumanized: "64GiB",
    Gpu: 1,
    Layers: "base",
    Uptime: "2h",
    Unschedulable: false,
    RunningTasks: 2,
  },
  {
    Address: "10.0.0.2:4701",
    ID: 2,
    Name: "worker-offline",
    SinceContact: "17m48.749863606s",
    Tasks: "TreeD",
    Cpu: 8,
    RamHumanized: "64GiB",
    Gpu: 0,
    Layers: "base",
    Uptime: "2h",
    Unschedulable: false,
    RunningTasks: 0,
    Restarting: true,
  },
  {
    Address: "10.0.0.3:4701",
    ID: 3,
    Name: "worker-cordoned",
    SinceContact: "15s",
    Tasks: "",
    Cpu: 4,
    RamHumanized: "32GiB",
    Gpu: 0,
    Layers: "base",
    Uptime: "1h",
    Unschedulable: true,
    RunningTasks: 0,
    RestartRequest: "2026-03-05T01:00:00Z",
  },
];

vi.mock("@tanstack/react-router", () => ({
  stripSearchParams: (defaults: unknown) => defaults,
  createFileRoute: () => (options: Record<string, unknown>) => options,
  useNavigate: () => navigateMock,
  Link: ({ children }: { children: ReactNode }) => (
    <a href="#mock">{children}</a>
  ),
  Outlet: () => <div data-testid="outlet" />,
}));

vi.mock("@/hooks/use-page-title", () => ({
  usePageTitle: () => undefined,
}));

vi.mock("@/hooks/use-curio-query", () => ({
  useCurioRpc: (...args: unknown[]) => useCurioRpcMock(...args),
  useCurioRpcMutation: (...args: unknown[]) => useCurioRpcMutationMock(...args),
}));

vi.mock("@/components/table/data-table", () => ({
  DataTable: ({
    data,
    columns,
  }: {
    data: MachineSummary[];
    columns: unknown[];
  }) => {
    const actionColumn = columns.find(
      (column) => (column as { id?: string }).id === "actions",
    ) as
      | {
          cell?: (context: { row: { original: MachineSummary } }) => ReactNode;
        }
      | undefined;

    return (
      <div>
        <div data-testid="visible-count">{data.length}</div>
        <div data-testid="visible-names">
          {data.map((row) => row.Name).join(",")}
        </div>
        {data.map((row) => (
          <div key={row.ID} data-testid={`row-actions-${row.ID}`}>
            {typeof actionColumn?.cell === "function"
              ? actionColumn.cell({ row: { original: row } })
              : null}
          </div>
        ))}
      </div>
    );
  },
}));

describe("machines filters", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    refetchMock.mockReset();
    useCurioRpcMock.mockReset();
    useCurioRpcMutationMock.mockReset();
    cordonMutateMock.mockReset();
    uncordonMutateMock.mockReset();
    restartMutateMock.mockReset();

    useCurioRpcMock.mockReturnValue({
      data: machinesFixture,
      isLoading: false,
      refetch: refetchMock,
    });
    useCurioRpcMutationMock.mockImplementation((method: string) => {
      if (method === "Cordon") {
        return { mutate: cordonMutateMock, isPending: false };
      }
      if (method === "Uncordon") {
        return { mutate: uncordonMutateMock, isPending: false };
      }
      if (method === "Restart") {
        return { mutate: restartMutateMock, isPending: false };
      }
      return { mutate: vi.fn(), isPending: false };
    });
  });

  it("filters runtime via toggle-group style controls", async () => {
    const { Route } = await import("./index");
    const MachinesRouteComponent = (
      Route as unknown as { component: () => ReactNode }
    ).component;

    render(<MachinesRouteComponent />);
    expect(
      screen.queryByText(
        "Cluster-wide machine status, capacity, and operation actions.",
      ),
    ).not.toBeInTheDocument();

    const runtimeGroup = screen.getByRole("group", { name: "Runtime filter" });
    expect(runtimeGroup).toBeInTheDocument();

    const offlineButton = within(runtimeGroup).getByRole("button", {
      name: "Offline",
    });
    fireEvent.click(offlineButton);

    expect(offlineButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("visible-count")).toHaveTextContent("1");
    expect(screen.getByTestId("visible-names")).toHaveTextContent(
      "worker-offline",
    );
  });

  it("filters scheduling and restart groups", async () => {
    const { Route } = await import("./index");
    const MachinesRouteComponent = (
      Route as unknown as { component: () => ReactNode }
    ).component;

    render(<MachinesRouteComponent />);

    fireEvent.click(
      within(
        screen.getByRole("group", { name: "Scheduling filter" }),
      ).getByRole("button", { name: "Cordoned" }),
    );
    expect(screen.getByTestId("visible-count")).toHaveTextContent("1");
    expect(screen.getByTestId("visible-names")).toHaveTextContent(
      "worker-cordoned",
    );

    fireEvent.click(
      within(screen.getByRole("group", { name: "Restart filter" })).getByRole(
        "button",
        { name: "Requested" },
      ),
    );
    expect(screen.getByTestId("visible-count")).toHaveTextContent("1");
    expect(screen.getByTestId("visible-names")).toHaveTextContent(
      "worker-cordoned",
    );

    fireEvent.click(
      within(
        screen.getByRole("group", { name: "Scheduling filter" }),
      ).getByRole("button", { name: "All" }),
    );
    fireEvent.click(
      within(screen.getByRole("group", { name: "Restart filter" })).getByRole(
        "button",
        { name: "Restarting" },
      ),
    );
    expect(screen.getByTestId("visible-count")).toHaveTextContent("1");
    expect(screen.getByTestId("visible-names")).toHaveTextContent(
      "worker-offline",
    );
  });

  it("resets active filters and query", async () => {
    const { Route } = await import("./index");
    const MachinesRouteComponent = (
      Route as unknown as { component: () => ReactNode }
    ).component;

    render(<MachinesRouteComponent />);

    fireEvent.change(screen.getByRole("textbox", { name: "Search machines" }), {
      target: { value: "offline" },
    });
    expect(screen.getByTestId("visible-count")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "Reset Filters" }));
    expect(screen.getByTestId("visible-count")).toHaveTextContent("3");
  });

  it("opens and cancels action confirmation dialog", async () => {
    const { Route } = await import("./index");
    const MachinesRouteComponent = (
      Route as unknown as { component: () => ReactNode }
    ).component;

    render(<MachinesRouteComponent />);

    const rowActions = screen.getByTestId("row-actions-1");
    fireEvent.click(within(rowActions).getByTitle("Cordon"));

    expect(screen.getByText("Confirm Cordon")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cordonMutateMock).not.toHaveBeenCalled();
  });

  it("confirms action dialog and dispatches mutation", async () => {
    const { Route } = await import("./index");
    const MachinesRouteComponent = (
      Route as unknown as { component: () => ReactNode }
    ).component;

    render(<MachinesRouteComponent />);

    const rowActions = screen.getByTestId("row-actions-1");
    fireEvent.click(within(rowActions).getByTitle("Cordon"));
    fireEvent.click(screen.getByRole("button", { name: "Cordon" }));

    expect(cordonMutateMock).toHaveBeenCalledWith(
      [1],
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
  });

  it("renders a single page-level heading in machines layout", async () => {
    const { MachinesLayout } = await import("./route");
    render(<MachinesLayout />);

    const headings = screen.getAllByRole("heading", {
      level: 1,
      name: "Cluster Machines",
    });
    expect(headings).toHaveLength(1);
    expect(
      screen.queryByText(
        "Monitor machine runtime, scheduling, and restart states.",
      ),
    ).not.toBeInTheDocument();
  });
});
