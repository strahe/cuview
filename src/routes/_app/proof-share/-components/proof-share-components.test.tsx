import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddClientDialog } from "./add-client-dialog";
import { ClientMessagesCard } from "./client-messages-card";
import { ClientRequestsCard } from "./client-requests-card";
import { ClientWalletsCard } from "./client-wallets-card";
import { ProviderQueueCard } from "./provider-queue-card";
import { ProviderSettingsDialog } from "./provider-settings-dialog";
import { RouterBalanceCard } from "./router-balance-card";

const {
  addBalanceMutateMock,
  addWalletMutateMock,
  cancelWithdrawMutateMock,
  clientRequestsDataState,
  clientSetMutateMock,
  completeWithdrawMutateMock,
  pendingState,
  requestWithdrawMutateMock,
  setMetaMutateMock,
} = vi.hoisted(() => ({
  addBalanceMutateMock: vi.fn(),
  addWalletMutateMock: vi.fn(),
  cancelWithdrawMutateMock: vi.fn(),
  clientRequestsDataState: {
    data: [] as Array<{
      task_id: number;
      sp_id: string;
      sector_num: number;
      request_sent: boolean;
      done: boolean;
      request_uploaded: boolean;
      created_at: string;
      request_cid?: string;
      done_at?: string;
      payment_amount?: string;
    }>,
  },
  clientSetMutateMock: vi.fn(),
  completeWithdrawMutateMock: vi.fn(),
  pendingState: {
    addBalance: false,
    addWallet: false,
    cancelWithdraw: false,
    clientSet: false,
    completeWithdraw: false,
    requestWithdraw: false,
    setMeta: false,
  },
  requestWithdrawMutateMock: vi.fn(),
  setMetaMutateMock: vi.fn(),
}));

vi.mock("@/components/composed/status-badge", () => ({
  StatusBadge: ({ label, status }: { label: string; status: string }) => (
    <span data-status={status}>{label}</span>
  ),
}));

vi.mock("@/components/table/data-table", () => ({
  DataTable: ({
    columns,
    data,
    emptyMessage,
  }: {
    columns: Array<{
      accessorKey?: string;
      cell?: (props: {
        row: { original: Record<string, unknown> };
      }) => ReactNode;
    }>;
    data: Array<Record<string, unknown>>;
    emptyMessage?: string;
  }) => {
    if (data.length === 0) {
      return <div>{emptyMessage ?? "No data"}</div>;
    }

    return (
      <div>
        {data.map((row, rowIndex) => (
          <div key={rowIndex}>
            {columns.map((column, columnIndex) => {
              const content = column.cell
                ? column.cell({ row: { original: row } })
                : column.accessorKey
                  ? String(row[column.accessorKey] ?? "")
                  : null;

              return <div key={columnIndex}>{content}</div>;
            })}
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    type = "button",
    size: _size,
    variant: _variant,
    ...props
  }: ComponentProps<"button"> & {
    size?: string;
    variant?: string;
  }) => (
    <button type={type} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({
    children,
    ...props
  }: ComponentProps<"h2"> & { children: ReactNode }) => (
    <h2 {...props}>{children}</h2>
  ),
}));

vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({
    checked,
    id,
    onCheckedChange,
    ...props
  }: {
    checked?: boolean;
    id?: string;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open = false,
    children,
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: ReactNode;
  }) => (open ? <div>{children}</div> : null),
  DialogContent: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  DialogFooter: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  DialogHeader: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  DialogTitle: ({
    children,
    ...props
  }: ComponentProps<"h2"> & { children: ReactNode }) => (
    <h2 {...props}>{children}</h2>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: ComponentProps<"input">) => <input {...props} />,
}));

vi.mock("../-module/queries", () => ({
  usePsClientAddWallet: () => ({
    mutate: addWalletMutateMock,
    isPending: pendingState.addWallet,
  }),
  usePsClientRequests: (_spId: number, enabled: boolean) => ({
    data: enabled ? clientRequestsDataState.data : undefined,
  }),
  usePsClientSet: () => ({
    mutate: clientSetMutateMock,
    isPending: pendingState.clientSet,
  }),
  usePsRouterAddBalance: () => ({
    mutate: addBalanceMutateMock,
    isPending: pendingState.addBalance,
  }),
  usePsRouterCancelWithdrawal: () => ({
    mutate: cancelWithdrawMutateMock,
    isPending: pendingState.cancelWithdraw,
  }),
  usePsRouterCompleteWithdrawal: () => ({
    mutate: completeWithdrawMutateMock,
    isPending: pendingState.completeWithdraw,
  }),
  usePsRouterRequestWithdrawal: () => ({
    mutate: requestWithdrawMutateMock,
    isPending: pendingState.requestWithdraw,
  }),
  usePsSetMeta: () => ({
    mutate: setMetaMutateMock,
    isPending: pendingState.setMeta,
  }),
}));

describe("proof-share component regressions", () => {
  beforeEach(() => {
    addBalanceMutateMock.mockReset();
    addWalletMutateMock.mockReset();
    cancelWithdrawMutateMock.mockReset();
    clientSetMutateMock.mockReset();
    completeWithdrawMutateMock.mockReset();
    requestWithdrawMutateMock.mockReset();
    setMetaMutateMock.mockReset();

    clientRequestsDataState.data = [];

    pendingState.addBalance = false;
    pendingState.addWallet = false;
    pendingState.cancelWithdraw = false;
    pendingState.clientSet = false;
    pendingState.completeWithdraw = false;
    pendingState.requestWithdraw = false;
    pendingState.setMeta = false;
  });

  it("keeps explicit zero minimum pending seconds and waits for mutation success before closing", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<AddClientDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByPlaceholderText("f01234..."), "f01234");
    const minimumPendingInput = screen.getAllByRole("spinbutton")[1]!;
    await user.clear(minimumPendingInput);
    await user.type(minimumPendingInput, "0");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(clientSetMutateMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          address: "f01234",
          minimum_pending_seconds: 0,
        }),
      ],
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
    expect(onOpenChange).not.toHaveBeenCalled();

    const onSuccess = clientSetMutateMock.mock.calls[0]?.[1]?.onSuccess as
      | (() => void)
      | undefined;
    onSuccess?.();

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not overwrite provider settings edits while the dialog stays open", async () => {
    const user = userEvent.setup();
    const view = render(
      <ProviderSettingsDialog
        open
        onOpenChange={vi.fn()}
        meta={{
          enabled: true,
          wallet: { Valid: true, String: "f1alpha" },
          request_task_id: null,
          price: "0.005",
        }}
      />,
    );

    const walletInput = screen.getByPlaceholderText("Wallet address");
    await user.clear(walletInput);
    await user.type(walletInput, "draft-wallet");

    view.rerender(
      <ProviderSettingsDialog
        open
        onOpenChange={vi.fn()}
        meta={{
          enabled: false,
          wallet: { Valid: true, String: "f1beta" },
          request_task_id: null,
          price: "0.007",
        }}
      />,
    );

    expect(screen.getByDisplayValue("draft-wallet")).toBeVisible();
  });

  it("labels provider price with a higher-level unit and only closes after a successful save", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <ProviderSettingsDialog
        open
        onOpenChange={onOpenChange}
        meta={{
          enabled: true,
          wallet: { Valid: true, String: "f1alpha" },
          request_task_id: null,
          price: "0.005",
        }}
      />,
    );

    expect(screen.getByText("Price (FIL/p)")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(setMetaMutateMock).toHaveBeenCalledWith(
      [true, "f1alpha", "0.005"],
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("formats wallet balances and waits for add-wallet success before closing the dialog", async () => {
    const user = userEvent.setup();

    render(
      <ClientWalletsCard
        loading={false}
        wallets={[
          {
            wallet: 1,
            address: "f1wallet",
            chain_balance: "1000000000000000000",
            available_balance: "2000000000000000000",
            router_avail_balance: "3000000000000000000",
            router_unsettled_balance: "4000000000000000000",
            router_unlocked_balance: "5000000000000000000",
          },
        ]}
      />,
    );

    expect(screen.getByText("Chain: 1.0000 FIL")).toBeVisible();
    expect(screen.getByText("Available: 2.0000 FIL")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /Add Wallet/i }));
    await user.type(screen.getByPlaceholderText("Wallet address"), "f1new");
    await user.click(screen.getByRole("button", { name: /^Add$/ }));

    expect(addWalletMutateMock).toHaveBeenCalledWith(
      ["f1new"],
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
    expect(screen.getByPlaceholderText("Wallet address")).toBeVisible();

    const onSuccess = addWalletMutateMock.mock.calls[0]?.[1]?.onSuccess as
      | (() => void)
      | undefined;
    onSuccess?.();

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Wallet address"),
      ).not.toBeInTheDocument();
    });
  });

  it("trims router balance inputs before mutating", async () => {
    const user = userEvent.setup();

    render(<RouterBalanceCard />);

    await user.type(
      screen.getByPlaceholderText("Wallet address"),
      "f1trimmed   ",
    );
    await user.type(screen.getByPlaceholderText("0"), " 42 ");
    await user.click(screen.getByRole("button", { name: "Add Balance" }));

    expect(addBalanceMutateMock).toHaveBeenCalledWith(["f1trimmed", "42"]);
  });

  it("disables every router-balance action while any related mutation is pending", async () => {
    const user = userEvent.setup();
    pendingState.addBalance = true;

    render(<RouterBalanceCard />);

    await user.type(screen.getByPlaceholderText("Wallet address"), "f1wallet");
    await user.type(screen.getByPlaceholderText("0"), "1");

    expect(screen.getByRole("button", { name: "Add Balance" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Request Withdraw" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cancel Withdraw" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Complete Withdraw" }),
    ).toBeDisabled();
  });

  it("uses a numeric-only SP ID input for client requests", () => {
    render(<ClientRequestsCard />);

    const input = screen.getByPlaceholderText("SP ID") as HTMLInputElement;
    const loadButton = screen.getByRole("button", { name: "Load Requests" });

    fireEvent.change(input, {
      target: { value: "abc" },
    });

    expect(input.type).toBe("number");
    expect(input.value).toBe("");
    expect(loadButton).toBeDisabled();
  });

  it("paginates long request lists", async () => {
    const user = userEvent.setup();

    clientRequestsDataState.data = Array.from({ length: 25 }, (_, index) => ({
      task_id: index + 1,
      sp_id: "42",
      sector_num: index + 100,
      request_uploaded: true,
      request_sent: true,
      done: false,
      created_at: `2026-03-20T00:00:${String(index).padStart(2, "0")}Z`,
    }));

    render(<ClientRequestsCard />);

    fireEvent.change(screen.getByPlaceholderText("SP ID"), {
      target: { value: "42" },
    });
    await user.click(screen.getByRole("button", { name: "Load Requests" }));

    expect(screen.getByText("#1")).toBeVisible();
    expect(screen.queryByText("#25")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("#25")).toBeVisible();
  });

  it("paginates long message lists", async () => {
    const user = userEvent.setup();

    render(
      <ClientMessagesCard
        messages={Array.from({ length: 25 }, (_, index) => ({
          action: `message-${index + 1}`,
          address: "f1wallet",
          signed_cid: `bafy${index + 1}`,
          started_at: `2026-03-20T00:00:${String(index).padStart(2, "0")}Z`,
          wallet: 1,
        }))}
      />,
    );

    expect(screen.getByText("message-1")).toBeVisible();
    expect(screen.queryByText("message-25")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("message-25")).toBeVisible();
  });

  it("treats task id 0 as a running task", () => {
    render(
      <ProviderQueueCard
        headerAction={null}
        loading={false}
        queue={[
          {
            service_id: "service-1",
            obtained_at: "2026-03-20T00:00:00Z",
            compute_task_id: { Valid: true, Int64: 0 },
            compute_done: false,
            submit_task_id: null,
            submit_done: false,
            was_pow: false,
            payment_amount: "0",
          },
        ]}
      />,
    );

    expect(screen.getByText("Task #0")).toBeVisible();
  });
});
