import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurioRestAccessError } from "@/utils/curio-rest-access";
import { HistoryDialog } from "./history-dialog";

const {
  historyEntries,
  historyEntryDetail,
  useConfigHistoryEntryMock,
  useConfigHistoryMock,
} = vi.hoisted(() => ({
  historyEntries: [
    {
      content: '{"workers":["alpha"]}',
      createdAt: "2026-03-20T12:00:00Z",
      id: 5,
      layer: "layer-a",
    },
  ],
  historyEntryDetail: {
    changed_at: "2026-03-20T12:00:00Z",
    id: 5,
    new_config: '{"workers":["alpha"]}',
    old_config: '{"workers":[]}',
    title: "history-entry",
  },
  useConfigHistoryEntryMock: vi.fn(),
  useConfigHistoryMock: vi.fn(),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    type = "button",
    variant: _variant,
    size: _size,
    ...props
  }: ComponentProps<"button"> & { size?: string; variant?: string }) => (
    <button type={type} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open = false,
  }: {
    children: ReactNode;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
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

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: (props: ComponentProps<"div">) => <div {...props} />,
}));

vi.mock("../-module/queries", () => ({
  useConfigHistory: useConfigHistoryMock,
  useConfigHistoryEntry: useConfigHistoryEntryMock,
}));

vi.mock("./history-diff-viewer", () => ({
  HistoryDiffViewer: ({
    newLabel,
    oldLabel,
  }: {
    newLabel: string;
    oldLabel: string;
  }) => (
    <div>
      <span>{oldLabel}</span>
      <span>{newLabel}</span>
    </div>
  ),
}));

describe("HistoryDialog", () => {
  beforeEach(() => {
    useConfigHistoryMock.mockReset();
    useConfigHistoryEntryMock.mockReset();

    useConfigHistoryMock.mockReturnValue({
      data: historyEntries,
      error: null,
      isLoading: false,
    });

    useConfigHistoryEntryMock.mockImplementation(
      (layer: string | null, id: number | null) => ({
        data: layer && id ? historyEntryDetail : null,
        error: null,
        isLoading: false,
      }),
    );
  });

  it("uses version-relative labels for expanded history diffs", async () => {
    const user = userEvent.setup();

    render(
      <HistoryDialog
        layer="layer-a"
        open
        onOpenChange={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /version #5/i }));

    expect(screen.getByText("Version #5 (Before change)")).toBeInTheDocument();
    expect(screen.getByText("Version #5 (After change)")).toBeInTheDocument();
  });

  it("shows REST access errors instead of empty history content", () => {
    useConfigHistoryMock.mockReturnValue({
      data: [],
      error: new CurioRestAccessError(new TypeError("Failed to fetch")),
      isLoading: false,
    });

    render(<HistoryDialog layer="layer-a" open onOpenChange={vi.fn()} />);

    expect(screen.getByText("Curio REST blocked.")).toBeInTheDocument();
    expect(screen.queryByText("No history entries.")).not.toBeInTheDocument();
  });

  it("shows REST access errors for expanded history details", async () => {
    const user = userEvent.setup();
    useConfigHistoryEntryMock.mockImplementation(
      (layer: string | null, id: number | null) => ({
        data: null,
        error:
          layer && id
            ? new CurioRestAccessError(new TypeError("Failed to fetch"))
            : null,
        isLoading: false,
      }),
    );

    render(
      <HistoryDialog
        layer="layer-a"
        open
        onOpenChange={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /version #5/i }));

    expect(screen.getByText("Curio REST blocked.")).toBeInTheDocument();
    expect(
      screen.queryByText("Version #5 (Before change)"),
    ).not.toBeInTheDocument();
  });

  it("resets expanded state when closed and when the layer changes", async () => {
    const user = userEvent.setup();
    const view = render(
      <HistoryDialog
        layer="layer-a"
        open
        onOpenChange={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /version #5/i }));
    expect(screen.getByText("Version #5 (Before change)")).toBeInTheDocument();

    view.rerender(
      <HistoryDialog
        layer="layer-a"
        open={false}
        onOpenChange={vi.fn()}
        onRestore={vi.fn()}
      />,
    );
    view.rerender(
      <HistoryDialog
        layer="layer-a"
        open
        onOpenChange={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    expect(
      screen.queryByText("Version #5 (Before change)"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /version #5/i }));
    expect(screen.getByText("Version #5 (Before change)")).toBeInTheDocument();

    view.rerender(
      <HistoryDialog
        layer="layer-b"
        open
        onOpenChange={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    expect(
      screen.queryByText("Version #5 (Before change)"),
    ).not.toBeInTheDocument();
  });
});
