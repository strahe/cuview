import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddRuleDialog } from "./add-rule-dialog";
import { EditRuleDialog } from "./edit-rule-dialog";
import { RenameWalletDialog } from "./rename-wallet-dialog";

const {
  addBalanceRuleMutateMock,
  addBalanceRuleResetMock,
  renameWalletMutateMock,
  renameWalletResetMock,
  updateBalanceRuleMutateMock,
  updateBalanceRuleResetMock,
} = vi.hoisted(() => ({
  addBalanceRuleMutateMock: vi.fn(),
  addBalanceRuleResetMock: vi.fn(),
  renameWalletMutateMock: vi.fn(),
  renameWalletResetMock: vi.fn(),
  updateBalanceRuleMutateMock: vi.fn(),
  updateBalanceRuleResetMock: vi.fn(),
}));

vi.mock("@/components/composed/form/wallet-combobox-field", () => ({
  WalletComboboxField: ({
    field,
    label,
    placeholder,
  }: {
    field: {
      name: string;
      state: { value: unknown };
      handleChange: (v: string) => void;
      handleBlur: () => void;
    };
    label?: string;
    placeholder?: string;
    wallets?: Record<string, string>;
    [key: string]: unknown;
  }) => (
    <div>
      {label && <label>{label}</label>}
      <input
        name={field.name}
        value={String(field.state.value ?? "")}
        placeholder={placeholder}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
    </div>
  ),
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

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
    <div data-value={value}>{children}</div>
  ),
  SelectTrigger: ({
    children,
    ...props
  }: ComponentProps<"button"> & { children: ReactNode }) => (
    <button type="button" role="combobox" aria-expanded="false" {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder ?? ""}</span>
  ),
}));

vi.mock("../-module/queries", () => ({
  useAddBalanceRule: () => ({
    mutate: addBalanceRuleMutateMock,
    reset: addBalanceRuleResetMock,
    isPending: false,
    isError: false,
    error: null,
  }),
  useRenameWallet: () => ({
    mutate: renameWalletMutateMock,
    reset: renameWalletResetMock,
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateBalanceRule: () => ({
    mutate: updateBalanceRuleMutateMock,
    reset: updateBalanceRuleResetMock,
    isPending: false,
    isError: false,
    error: null,
  }),
  useWalletNames: () => ({ data: {}, isLoading: false, error: null }),
}));

describe("wallet dialog prop synchronization", () => {
  beforeEach(() => {
    addBalanceRuleMutateMock.mockReset();
    addBalanceRuleResetMock.mockReset();
    renameWalletMutateMock.mockReset();
    renameWalletResetMock.mockReset();
    updateBalanceRuleMutateMock.mockReset();
    updateBalanceRuleResetMock.mockReset();
  });

  it("submits a numeric ruleId when saving an edited balance rule", async () => {
    const user = userEvent.setup();

    render(
      <EditRuleDialog
        open
        onOpenChange={vi.fn()}
        ruleId={42}
        currentLow=" 5 "
        currentHigh=" 9 "
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateBalanceRuleMutateMock).toHaveBeenCalledWith(
      [42, "5", "9"],
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
  });

  it("resyncs edit-rule watermarks when rule props change while mounted", async () => {
    const user = userEvent.setup();
    const view = render(
      <EditRuleDialog
        open
        onOpenChange={vi.fn()}
        ruleId={1}
        currentLow="10"
        currentHigh="20"
      />,
    );

    const [lowInput, highInput] = screen.getAllByRole("textbox") as [
      HTMLElement,
      HTMLElement,
    ];
    await user.clear(lowInput);
    await user.type(lowInput, "999");
    await user.clear(highInput);
    await user.type(highInput, "888");

    view.rerender(
      <EditRuleDialog
        open
        onOpenChange={vi.fn()}
        ruleId={7}
        currentLow="30"
        currentHigh="40"
      />,
    );

    expect(screen.getByRole("heading", { name: "Edit Rule #7" })).toBeVisible();

    await waitFor(() => {
      expect(screen.getByDisplayValue("30")).toBeVisible();
      expect(screen.getByDisplayValue("40")).toBeVisible();
    });
  });

  it("resyncs the rename input when wallet props change while mounted", async () => {
    const user = userEvent.setup();
    const view = render(
      <RenameWalletDialog
        open
        address="f1alpha"
        currentName="Alpha Wallet"
        onOpenChange={vi.fn()}
      />,
    );

    const nameInput = screen.getByPlaceholderText("Wallet name");
    await user.clear(nameInput);
    await user.type(nameInput, "Temporary Draft");

    view.rerender(
      <RenameWalletDialog
        open
        address="f1beta"
        currentName="Beta Wallet"
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("f1beta")).toBeVisible();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Beta Wallet")).toBeVisible();
    });
  });

  it("reflects initialSubjectType changes while the add-rule dialog stays open", async () => {
    const view = render(
      <AddRuleDialog open initialSubjectType="wallet" onOpenChange={vi.fn()} />,
    );

    expect(
      screen.getByRole("heading", { name: "Add Wallet Rule" }),
    ).toBeVisible();
    expect(screen.getByText(/Second Address/i)).toBeVisible();

    view.rerender(
      <AddRuleDialog
        open
        initialSubjectType="proofshare"
        onOpenChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Add SnarkMarket Client Rule",
        }),
      ).toBeVisible();
      expect(screen.queryByText(/Second Address/i)).not.toBeInTheDocument();
    });
  });
});
