import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentPathname = "/wallets/list";
const navigateElementSpy = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    ...options,
    useSearch: () => ({}),
  }),
  useMatchRoute: () => (_opts: unknown) => false,
  useRouterState: () => ({ location: { pathname: currentPathname } }),
  Link: ({
    children,
    to,
    search,
    ...props
  }: {
    children?: ReactNode;
    to: string;
    search?: unknown;
  }) => (
    <a
      href={to}
      data-testid={`tab-link-${to}`}
      data-search={JSON.stringify(search ?? null)}
      {...props}
    >
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="wallets-outlet">outlet</div>,
  Navigate: (props: unknown) => {
    navigateElementSpy(props);
    return null;
  },
}));

vi.mock("@/components/ui/tabs", async () => {
  const React = await import("react");

  return {
    Tabs: ({ value, children }: { value: string; children: ReactNode }) => (
      <div data-testid="tabs" data-value={value}>
        {children}
      </div>
    ),
    TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    TabsTrigger: ({
      children,
      render,
      value,
    }: {
      children: ReactNode;
      render?: ReactElement;
      value: string;
    }) => {
      if (render && React.isValidElement(render)) {
        return React.cloneElement(
          render as ReactElement<{
            children?: ReactNode;
            "data-testid"?: string;
          }>,
          {
            "data-testid": `tab-link-${value}`,
            children,
          },
        );
      }

      return <button data-testid={`tab-link-${value}`}>{children}</button>;
    },
  };
});

vi.mock("@/components/table/data-table", () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table" data-rows={data.length} />
  ),
}));

vi.mock("@/hooks/use-page-title", () => ({
  usePageTitle: vi.fn(),
}));

vi.mock("./-module/queries", () => ({
  useWalletList: () => ({
    data: [
      {
        address: "f1abc",
        name: "Main Wallet",
        idAddress: "f01001",
        keyAddress: "f1abc",
        balance: "12 FIL",
        pendingMessages: 2,
        isLoadingBalance: false,
        balanceError: false,
      },
      {
        address: "f1def",
        name: "Cold Wallet",
        idAddress: "f01002",
        keyAddress: "f1def",
        balance: "0 FIL",
        pendingMessages: 0,
        isLoadingBalance: false,
        balanceError: false,
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
  }),
  useBalanceRules: () => ({
    data: [
      {
        id: 1,
        subjectAddress: "f01001",
        secondAddress: "f01002",
        actionType: "requester",
        actionTypeLabel: "Keep Subject Above Low",
        subjectType: "wallet",
        lowWatermark: "5 FIL",
        highWatermark: "10 FIL",
        taskId: 42,
        lastMsgCid: "bafy-wallet-msg",
        lastMsgSentAt: "2026-03-15T12:00:00Z",
        lastMsgLandedAt: null,
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
  }),
  usePendingMessages: () => ({
    data: {
      messages: [
        {
          message: "bafy-pending-msg",
          added_at: "2026-03-15T12:00:00Z",
        },
      ],
      total: 1,
    },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useRemoveWallet: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveBalanceRule: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("./-components/add-wallet-dialog", () => ({
  AddWalletDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="add-wallet-dialog" /> : null,
}));

vi.mock("./-components/rename-wallet-dialog", () => ({
  RenameWalletDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="rename-wallet-dialog" /> : null,
}));

vi.mock("./-components/add-rule-dialog", () => ({
  AddRuleDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="add-rule-dialog" /> : null,
}));

vi.mock("./-components/edit-rule-dialog", () => ({
  EditRuleDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-rule-dialog" /> : null,
}));

vi.mock("./-components/message-detail-card", () => ({
  MessageDetailCard: () => <div data-testid="message-detail-card" />,
}));

describe("wallets routes", () => {
  beforeEach(() => {
    currentPathname = "/wallets/list";
    navigateElementSpy.mockReset();
  });

  it("redirects /wallets to /wallets/list", async () => {
    const { Route } = await import("./index");
    const RedirectComponent = (
      Route as unknown as { component: () => ReactNode }
    ).component;

    render(<RedirectComponent />);

    expect(navigateElementSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/wallets/list" }),
    );
  });

  it("renders wallets tabs layout instead of the generated hello placeholder", async () => {
    currentPathname = "/wallets/messages";

    const { WalletsLayout } = await import("./route");
    render(<WalletsLayout />);

    expect(
      screen.getByRole("heading", { name: "Wallets" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("tab-link-/wallets/list")).toHaveTextContent(
      "Wallets",
    );
    expect(
      screen.getByTestId("tab-link-/wallets/balance-manager"),
    ).toHaveTextContent("Balance Manager");
    expect(screen.getByTestId("tab-link-/wallets/messages")).toHaveTextContent(
      "Messages",
    );
    expect(screen.getByTestId("tabs")).toHaveAttribute(
      "data-value",
      "/wallets/messages",
    );
    expect(screen.getByTestId("wallets-outlet")).toBeInTheDocument();
  });

  it("renders the wallet list page with stats and add action", async () => {
    const { WalletListPage } = await import("./list");
    render(<WalletListPage />);

    expect(screen.getByText("Total Wallets")).toBeInTheDocument();
    expect(screen.getByText("Wallets with Balance")).toBeInTheDocument();
    expect(screen.getByText("Pending Messages")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Wallet" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("data-table")).toHaveAttribute("data-rows", "2");
  });

  it("renders balance manager actions aligned with Curio", async () => {
    const { WalletBalanceManagerPage } = await import("./balance-manager");
    render(<WalletBalanceManagerPage />);

    expect(
      screen.getByRole("button", { name: "Add Wallet Rule" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add SnarkMarket Client Rule" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add F05 Rule" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("data-table")).toHaveAttribute("data-rows", "1");
  });

  it("renders pending messages and message lookup instead of placeholders", async () => {
    const { WalletMessagesPage } = await import("./messages");
    render(<WalletMessagesPage />);

    expect(screen.getByText("Pending Messages")).toBeInTheDocument();
    expect(screen.getByText("Message Lookup")).toBeInTheDocument();
    expect(screen.getByTestId("message-detail-card")).toBeInTheDocument();
    expect(screen.getByTestId("data-table")).toHaveAttribute("data-rows", "1");
  });
});
