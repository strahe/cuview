import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StorageAskTableEntry } from "@/types/market";
import { SetAskDialog } from "./set-ask-dialog";

const { setStorageAskMutateMock, setStorageAskResetMock } = vi.hoisted(() => ({
  setStorageAskMutateMock: vi.fn(),
  setStorageAskResetMock: vi.fn(),
}));

vi.mock("@/components/composed/fil-price-input", () => ({
  FilPriceInput: ({
    value,
    onChange,
    ...props
  }: ComponentProps<"input"> & {
    value: number;
    onChange: (value: number) => void;
  }) => (
    <input
      {...props}
      type="number"
      value={String(value)}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  ),
}));

vi.mock("@/components/composed/size-select", () => ({
  SizeSelect: ({
    value,
    onChange,
    ...props
  }: ComponentProps<"input"> & {
    value: number;
    onChange: (value: number) => void;
  }) => (
    <input
      {...props}
      type="number"
      value={String(value)}
      onChange={(event) => onChange(Number(event.target.value))}
    />
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

vi.mock("../-module/queries", () => ({
  useSetStorageAsk: () => ({
    mutate: setStorageAskMutateMock,
    reset: setStorageAskResetMock,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

function makeEntry(
  overrides: Partial<StorageAskTableEntry>,
): StorageAskTableEntry {
  return {
    id: "f01000",
    SpID: 1000,
    Miner: "f01000",
    hasAsk: true,
    Price: 11,
    VerifiedPrice: 12,
    MinSize: 4,
    MaxSize: 8,
    ...overrides,
  };
}

describe("SetAskDialog", () => {
  beforeEach(() => {
    setStorageAskMutateMock.mockReset();
    setStorageAskResetMock.mockReset();
  });

  it("resyncs storage ask defaults when the entry changes while mounted", async () => {
    const user = userEvent.setup();
    const view = render(
      <SetAskDialog
        open
        onOpenChange={vi.fn()}
        entry={makeEntry({ id: "f01001", SpID: 1001, Miner: "f01001" })}
      />,
    );

    const priceInput = screen.getByLabelText("Price");
    await user.clear(priceInput);
    await user.type(priceInput, "999");

    view.rerender(
      <SetAskDialog
        open
        onOpenChange={vi.fn()}
        entry={makeEntry({
          id: "f01002",
          SpID: 1002,
          Miner: "f01002",
          Price: 21,
          VerifiedPrice: 22,
        })}
      />,
    );

    expect(screen.getByText("f01002")).toBeVisible();

    await waitFor(() => {
      expect(screen.getByLabelText("Price")).toHaveValue(21);
      expect(screen.getByLabelText("Verified Price")).toHaveValue(22);
    });
  });
});
