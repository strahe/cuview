import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FsUpdateProviderDialog } from "./fs-update-provider-dialog";

type MutationState = {
  error: Error | null;
  isError: boolean;
  isPending: boolean;
};

const { mutateMock, mutationControls } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  mutationControls: {
    setState: null as null | ((state: MutationState) => void),
  },
}));

vi.mock("@/components/composed/form", () => ({
  AppFormActions: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  TextareaField: ({
    field,
    label,
    disabled,
  }: {
    disabled?: boolean;
    field: {
      handleChange: (value: string) => void;
      state: { value: string };
    };
    label: string;
  }) => (
    <label>
      {label}
      <textarea
        aria-label={label}
        disabled={disabled}
        onChange={(event) => field.handleChange(event.target.value)}
        value={field.state.value}
      />
    </label>
  ),
  TextField: ({
    field,
    label,
    disabled,
  }: {
    disabled?: boolean;
    field: {
      handleChange: (value: string) => void;
      state: { value: string };
    };
    label: string;
  }) => (
    <label>
      {label}
      <input
        aria-label={label}
        disabled={disabled}
        onChange={(event) => field.handleChange(event.target.value)}
        value={field.state.value}
      />
    </label>
  ),
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

vi.mock("../-module/queries", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  const cleanState: MutationState = {
    error: null,
    isError: false,
    isPending: false,
  };

  return {
    useFsUpdateProvider: () => {
      const [state, setState] = React.useState(cleanState);
      mutationControls.setState = setState;

      return {
        ...state,
        mutate: (...args: unknown[]) => {
          setState({ ...cleanState, isPending: true });
          mutateMock(...args);
        },
        reset: () => setState(cleanState),
      };
    },
  };
});

describe("FsUpdateProviderDialog", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    mutationControls.setState = null;
  });

  it("keeps pending state when reopened during an update", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <FsUpdateProviderDialog
        currentDescription="Provider description"
        currentName="Provider"
        onOpenChange={vi.fn()}
        open
      />,
    );

    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Updating…" })).toBeDisabled();

    rerender(
      <FsUpdateProviderDialog
        currentDescription="Provider description"
        currentName="Provider"
        onOpenChange={vi.fn()}
        open={false}
      />,
    );
    rerender(
      <FsUpdateProviderDialog
        currentDescription="Provider description"
        currentName="Provider"
        onOpenChange={vi.fn()}
        open
      />,
    );

    expect(screen.getByRole("button", { name: "Updating…" })).toBeDisabled();
  });

  it("ignores duplicate submits while an update is pending", async () => {
    const user = userEvent.setup();
    render(
      <FsUpdateProviderDialog
        currentDescription="Provider description"
        currentName="Provider"
        onOpenChange={vi.fn()}
        open
      />,
    );

    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(mutateMock).toHaveBeenCalledTimes(1);
    fireEvent.submit(screen.getByLabelText("Name").closest("form")!);

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("Description")).toBeDisabled();
  });

  it("does not close a later dialog instance when an earlier update succeeds", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <FsUpdateProviderDialog
        currentDescription="Provider description"
        currentName="Provider"
        onOpenChange={onOpenChange}
        open
      />,
    );

    await user.click(screen.getByRole("button", { name: "Update" }));

    rerender(
      <FsUpdateProviderDialog
        currentDescription="Provider description"
        currentName="Provider"
        onOpenChange={onOpenChange}
        open={false}
      />,
    );
    rerender(
      <FsUpdateProviderDialog
        currentDescription="Provider description"
        currentName="Provider"
        onOpenChange={onOpenChange}
        open
      />,
    );

    const [, options] = mutateMock.mock.calls[0] as [
      unknown,
      { onSuccess: () => void },
    ];
    act(() => options.onSuccess());

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("clears stale error state when reopened after a failed update", async () => {
    const { rerender } = render(
      <FsUpdateProviderDialog
        currentDescription="Provider description"
        currentName="Provider"
        onOpenChange={vi.fn()}
        open
      />,
    );

    act(() => {
      mutationControls.setState?.({
        error: new Error("Failed to update provider"),
        isError: true,
        isPending: false,
      });
    });

    expect(await screen.findByText("Failed to update provider")).toBeVisible();

    rerender(
      <FsUpdateProviderDialog
        currentDescription="Provider description"
        currentName="Provider"
        onOpenChange={vi.fn()}
        open={false}
      />,
    );
    rerender(
      <FsUpdateProviderDialog
        currentDescription="Provider description"
        currentName="Provider"
        onOpenChange={vi.fn()}
        open
      />,
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Failed to update provider"),
      ).not.toBeInTheDocument();
    });
  });
});
