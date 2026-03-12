import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type DiagnosticsSearchState = {
  tab?: "commr" | "unsealed" | "vanilla" | "wdpost";
  sp?: string;
  sector?: number;
  deadline?: number;
  partition?: number;
};

let currentSearch: DiagnosticsSearchState = {
  tab: "commr",
  sp: "f01234",
  sector: 42,
};

const navigateMock = vi.fn();
const useCurioRpcMock = vi.fn();
const useCurioRpcMutationMock = vi.fn();
const commrStatusMutateMock = vi.fn();
const unsealedStatusMutateMock = vi.fn();

const commrHistoryFixture = [
  {
    check_id: 21,
    sp_id: 1234,
    sector_number: 42,
    file_type: "sealed",
    expected_comm_r: "baga6ea4seaq",
    create_time: "2026-03-06 18:00:00",
    complete: false,
  },
];

const unsealedHistoryFixture = [
  {
    check_id: 22,
    sp_id: 1234,
    sector_number: 42,
    expected_commd: "baga6ea4seaq",
    create_time: "2026-03-06 18:05:00",
    complete: false,
  },
];

vi.mock("@tanstack/react-router", () => ({
  stripSearchParams: (defaults: unknown) => defaults,
  createFileRoute: () => (options: Record<string, unknown>) => ({
    ...options,
    useSearch: () => currentSearch,
    useNavigate: () => navigateMock,
  }),
}));

vi.mock("@/hooks/use-curio-query", () => ({
  useCurioRpc: (...args: unknown[]) => useCurioRpcMock(...args),
  useCurioRpcMutation: (...args: unknown[]) => useCurioRpcMutationMock(...args),
}));

vi.mock("@/components/composed/status-badge", () => ({
  StatusBadge: ({
    status,
    children,
  }: {
    status: string;
    children: ReactNode;
  }) => <span data-status={status}>{children}</span>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    type = "button",
    ...props
  }: React.ComponentProps<"button">) => (
    <button type={type} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: React.ComponentProps<"h2">) => (
    <h2 {...props}>{children}</h2>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.ComponentProps<"input">) => <input {...props} />,
}));

vi.mock("@/components/ui/select", async () => {
  return {
    Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SelectTrigger: ({ children, ...props }: React.ComponentProps<"button">) => (
      <button type="button" role="combobox" aria-expanded="false" {...props}>
        {children}
      </button>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <span>{placeholder ?? ""}</span>
    ),
    SelectContent: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: {
      children: ReactNode;
      value: string;
    }) => <div data-value={value}>{children}</div>,
  };
});

vi.mock("@/components/ui/sheet", async () => {
  const React = await import("react");

  const SheetContext = React.createContext(false);

  return {
    Sheet: ({ children, open }: { children: ReactNode; open?: boolean }) => (
      <SheetContext.Provider value={!!open}>{children}</SheetContext.Provider>
    ),
    SheetContent: ({ children, ...props }: React.ComponentProps<"div">) => {
      const open = React.useContext(SheetContext);
      return open ? <div {...props}>{children}</div> : null;
    },
    SheetHeader: ({ children, ...props }: React.ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
    SheetTitle: ({ children, ...props }: React.ComponentProps<"h2">) => (
      <h2 {...props}>{children}</h2>
    ),
    SheetDescription: ({ children, ...props }: React.ComponentProps<"p">) => (
      <p {...props}>{children}</p>
    ),
  };
});

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/tooltip", async () => {
  const React = await import("react");

  return {
    TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
    TooltipContent: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    TooltipTrigger: ({
      children,
      render: rendered,
      ...props
    }: {
      children: ReactNode;
      render?: React.ReactElement;
    } & React.ComponentProps<"button">) => {
      if (rendered && React.isValidElement(rendered)) {
        return React.cloneElement(rendered, props, children);
      }

      return (
        <button type="button" {...props}>
          {children}
        </button>
      );
    },
  };
});

vi.mock("@/components/ui/hover-card", async () => {
  const React = await import("react");

  return {
    HoverCard: ({ children }: { children: ReactNode }) => <>{children}</>,
    HoverCardContent: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    HoverCardTrigger: ({
      children,
      render,
      ...props
    }: {
      children: ReactNode;
      render?: React.ReactElement;
    } & React.HTMLAttributes<HTMLElement>) => {
      if (render && React.isValidElement(render)) {
        return React.cloneElement(render, props, children);
      }

      return <button {...props}>{children}</button>;
    },
  };
});

describe("sectors diagnostics accessibility", () => {
  beforeEach(() => {
    currentSearch = {
      tab: "commr",
      sp: "f01234",
      sector: 42,
    };

    navigateMock.mockReset();
    useCurioRpcMock.mockReset();
    useCurioRpcMutationMock.mockReset();
    commrStatusMutateMock.mockReset();
    unsealedStatusMutateMock.mockReset();

    useCurioRpcMock.mockImplementation((method: string) => {
      if (method === "SectorCommRCheckList") {
        return {
          data: commrHistoryFixture,
          isLoading: false,
        };
      }

      if (method === "SectorUnsealedCheckList") {
        return {
          data: unsealedHistoryFixture,
          isLoading: false,
        };
      }

      return {
        data: null,
        isLoading: false,
      };
    });

    useCurioRpcMutationMock.mockImplementation((method: string) => {
      if (method === "SectorCommRCheckStatus") {
        return { mutate: commrStatusMutateMock, isPending: false, data: null };
      }

      if (method === "SectorUnsealedCheckStatus") {
        return {
          mutate: unsealedStatusMutateMock,
          isPending: false,
          data: null,
        };
      }

      return { mutate: vi.fn(), isPending: false, data: null };
    });
  });

  it("renders the miner context trigger without button semantics", async () => {
    const { Route } = await import("./index");
    const DiagnosticsRouteComponent = (
      Route as unknown as { component: () => ReactNode }
    ).component;

    render(<DiagnosticsRouteComponent />);

    expect(screen.getByText("f01234")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "f01234",
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps the CommR history refresh button outside the detail trigger", async () => {
    const { Route } = await import("./index");
    const DiagnosticsRouteComponent = (
      Route as unknown as { component: () => ReactNode }
    ).component;

    render(<DiagnosticsRouteComponent />);

    const historyButton = screen.getByRole("button", { name: /#21/i });
    const refreshButton = screen.getByRole("button", {
      name: "Refresh status",
    });

    expect(historyButton).not.toContainElement(refreshButton);

    fireEvent.click(refreshButton);

    expect(commrStatusMutateMock).toHaveBeenCalledWith(
      [21],
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
    expect(screen.queryByText("CommR Check Detail")).not.toBeInTheDocument();

    fireEvent.keyDown(historyButton, { key: " ", code: "Space" });

    expect(screen.getByText("CommR Check Detail")).toBeInTheDocument();
  });

  it("supports Spacebar on Unsealed history rows without nesting the refresh button", async () => {
    currentSearch = {
      tab: "unsealed",
      sp: "f01234",
      sector: 42,
    };

    const { Route } = await import("./index");
    const DiagnosticsRouteComponent = (
      Route as unknown as { component: () => ReactNode }
    ).component;

    render(<DiagnosticsRouteComponent />);

    const historyButton = screen.getByRole("button", { name: /#22/i });
    const refreshButton = screen.getByRole("button", {
      name: "Refresh status",
    });

    expect(historyButton).not.toContainElement(refreshButton);

    fireEvent.click(refreshButton);

    expect(unsealedStatusMutateMock).toHaveBeenCalledWith(
      [22],
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
    expect(screen.queryByText("Unsealed Check Detail")).not.toBeInTheDocument();

    fireEvent.keyDown(historyButton, { key: "Spacebar", code: "Space" });

    expect(screen.getByText("Unsealed Check Detail")).toBeInTheDocument();
  });
});
