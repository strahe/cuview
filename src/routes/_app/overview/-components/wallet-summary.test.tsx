import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { WalletView } from "@/routes/_app/wallets/-module/types";
import { WalletSummary } from "./wallet-summary";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children?: ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/composed/section-card", () => ({
  SectionCard: ({
    title,
    action,
    children,
  }: {
    title: string;
    action?: ReactNode;
    children: ReactNode;
  }) => (
    <section>
      <h2>{title}</h2>
      {action}
      {children}
    </section>
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="wallet-skeleton" />,
}));

function makeWallet(overrides: Partial<WalletView>): WalletView {
  return {
    address: "f1alpha",
    name: "Alpha Wallet",
    idAddress: null,
    keyAddress: null,
    balance: "2 FIL",
    pendingMessages: 0,
    isLoadingBalance: false,
    balanceError: false,
    ...overrides,
  };
}

describe("WalletSummary", () => {
  it("shows unresolved balances as a placeholder instead of 0 FIL", () => {
    render(
      <WalletSummary
        loading={false}
        data={[
          makeWallet({ address: "f1ready", name: "Ready", balance: "2 FIL" }),
          makeWallet({
            address: "f1loading",
            name: "Loading",
            balance: null,
            isLoadingBalance: true,
          }),
        ]}
      />,
    );

    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("2.00 FIL")).toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0 FIL")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Low balance")).not.toBeInTheDocument();
  });
});
