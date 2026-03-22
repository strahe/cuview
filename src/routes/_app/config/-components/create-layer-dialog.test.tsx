import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateLayerDialog } from "./create-layer-dialog";

const { mutateMock, mutationState, resetMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  mutationState: {
    error: null as Error | null,
    isPending: false,
  },
  resetMock: vi.fn(),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    type = "button",
    variant: _variant,
    ...props
  }: ComponentProps<"button"> & { variant?: string }) => (
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
  useCreateLayerMutation: () => ({
    mutate: mutateMock,
    reset: resetMock,
    get error() {
      return mutationState.error;
    },
    get isPending() {
      return mutationState.isPending;
    },
  }),
}));

describe("CreateLayerDialog", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    resetMock.mockReset();
    mutationState.error = null;
    mutationState.isPending = false;
    resetMock.mockImplementation(() => {
      mutationState.error = null;
    });
  });

  it("does not submit again from Enter while creation is pending", async () => {
    const user = userEvent.setup();
    const view = render(
      <CreateLayerDialog open onCreated={vi.fn()} onOpenChange={vi.fn()} />,
    );

    mutateMock.mockImplementation(() => {
      mutationState.isPending = true;
    });

    const input = screen.getByPlaceholderText("Layer name");
    await user.type(input, "Layer Alpha");
    await user.keyboard("{Enter}");

    expect(mutateMock).toHaveBeenCalledTimes(1);

    view.rerender(
      <CreateLayerDialog open onCreated={vi.fn()} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();

    screen.getByPlaceholderText("Layer name").focus();
    await user.keyboard("{Enter}");

    expect(mutateMock).toHaveBeenCalledTimes(1);
  });

  it("clears stale name and error state when reopened", async () => {
    const user = userEvent.setup();
    const view = render(
      <CreateLayerDialog open={false} onOpenChange={vi.fn()} />,
    );

    view.rerender(<CreateLayerDialog open onOpenChange={vi.fn()} />);

    const input = screen.getByPlaceholderText("Layer name");
    await user.type(input, "Draft Layer");

    mutationState.error = new Error("Layer already exists");
    view.rerender(<CreateLayerDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByDisplayValue("Draft Layer")).toBeVisible();
    expect(screen.getByText("Error: Layer already exists")).toBeVisible();

    view.rerender(<CreateLayerDialog open={false} onOpenChange={vi.fn()} />);
    view.rerender(<CreateLayerDialog open onOpenChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Layer name")).toHaveValue("");
      expect(
        screen.queryByText("Error: Layer already exists"),
      ).not.toBeInTheDocument();
    });

    expect(resetMock).toHaveBeenCalledTimes(2);
  });
});
