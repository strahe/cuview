import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, type ReactNode, StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateLayerDialog } from "./create-layer-dialog";

const { hookControls, mutateAsyncMock } = vi.hoisted(() => ({
  hookControls: {
    setState: null as null | ((state: MutationState) => void),
  },
  mutateAsyncMock: vi.fn(),
}));

type MutationState = {
  error: Error | null;
  isError: boolean;
  isPending: boolean;
};

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

vi.mock("../-module/queries", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  const cleanState: MutationState = {
    error: null,
    isError: false,
    isPending: false,
  };

  return {
    useCreateLayerMutation: () => {
      const [state, setState] = React.useState(cleanState);

      hookControls.setState = setState;

      return {
        ...state,
        mutateAsync: async (...args: unknown[]) => {
          setState({ ...cleanState, isPending: true });

          try {
            const result = await mutateAsyncMock(...args);
            setState(cleanState);
            return result;
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setState({ error, isError: true, isPending: false });
            throw err;
          }
        },
        reset: () => setState(cleanState),
      };
    },
  };
});

function createDeferred<T>() {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

describe("CreateLayerDialog", () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
    hookControls.setState = null;
  });

  it("does not submit again from Enter while creation is pending", async () => {
    const user = userEvent.setup();
    const view = render(
      <CreateLayerDialog open onCreated={vi.fn()} onOpenChange={vi.fn()} />,
    );

    mutateAsyncMock.mockImplementation(() => {
      return new Promise(() => {});
    });

    const input = screen.getByPlaceholderText("Layer name");
    await user.type(input, "Layer Alpha");
    await user.keyboard("{Enter}");

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);

    view.rerender(
      <CreateLayerDialog open onCreated={vi.fn()} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /Creating/ })).toBeDisabled();

    screen.getByPlaceholderText("Layer name").focus();
    await user.keyboard("{Enter}");

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
  });

  it("clears stale name and error state when reopened", async () => {
    const user = userEvent.setup();
    const view = render(
      <CreateLayerDialog open={false} onOpenChange={vi.fn()} />,
    );

    view.rerender(<CreateLayerDialog open onOpenChange={vi.fn()} />);

    const input = screen.getByPlaceholderText("Layer name");
    await user.type(input, "Draft Layer");

    mutateAsyncMock.mockRejectedValueOnce(new Error("Layer already exists"));
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(screen.getByDisplayValue("Draft Layer")).toBeVisible();
    expect(
      await screen.findByText("Error: Layer already exists"),
    ).toBeVisible();

    view.rerender(<CreateLayerDialog open={false} onOpenChange={vi.fn()} />);
    view.rerender(<CreateLayerDialog open onOpenChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Layer name")).toHaveValue("");
      expect(
        screen.queryByText("Error: Layer already exists"),
      ).not.toBeInTheDocument();
    });
  });

  it("does not close or select from an earlier dialog instance", async () => {
    const user = userEvent.setup();
    const pendingCreate = createDeferred<void>();
    const onCreated = vi.fn();
    const onOpenChange = vi.fn();
    const view = render(
      <CreateLayerDialog
        open
        onCreated={onCreated}
        onOpenChange={onOpenChange}
      />,
    );

    mutateAsyncMock.mockImplementation(() => {
      return pendingCreate.promise;
    });

    await user.type(screen.getByPlaceholderText("Layer name"), "Layer Alpha");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(mutateAsyncMock).toHaveBeenCalledWith("Layer Alpha");

    view.rerender(
      <CreateLayerDialog
        open={false}
        onCreated={onCreated}
        onOpenChange={onOpenChange}
      />,
    );
    view.rerender(
      <CreateLayerDialog
        open
        onCreated={onCreated}
        onOpenChange={onOpenChange}
      />,
    );

    await user.type(screen.getByPlaceholderText("Layer name"), "Second Draft");

    await act(async () => {
      pendingCreate.resolve();
      await pendingCreate.promise;
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
    });
    expect(onCreated).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue("Second Draft")).toBeVisible();
  });

  it("shows an in-flight create error after close and reopen", async () => {
    const user = userEvent.setup();
    const pendingCreate = createDeferred<void>();
    const view = render(
      <CreateLayerDialog open onCreated={vi.fn()} onOpenChange={vi.fn()} />,
    );

    mutateAsyncMock.mockReturnValue(pendingCreate.promise);

    await user.type(screen.getByPlaceholderText("Layer name"), "Layer Alpha");
    await user.click(screen.getByRole("button", { name: "Create" }));

    view.rerender(
      <CreateLayerDialog
        open={false}
        onCreated={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );
    view.rerender(
      <CreateLayerDialog open onCreated={vi.fn()} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /Creating/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();

    await act(async () => {
      pendingCreate.reject(new Error("Layer already exists"));
      await pendingCreate.promise.catch(() => undefined);
    });

    expect(
      await screen.findByText("Error: Layer already exists"),
    ).toBeVisible();
  });

  it("clears an in-flight create error before the next session when it fails while closed", async () => {
    const user = userEvent.setup();
    const pendingCreate = createDeferred<void>();
    const view = render(
      <CreateLayerDialog open onCreated={vi.fn()} onOpenChange={vi.fn()} />,
    );

    mutateAsyncMock.mockReturnValue(pendingCreate.promise);

    await user.type(screen.getByPlaceholderText("Layer name"), "Layer Alpha");
    await user.click(screen.getByRole("button", { name: "Create" }));

    view.rerender(
      <CreateLayerDialog
        open={false}
        onCreated={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );

    await act(async () => {
      pendingCreate.reject(new Error("Layer already exists"));
      await pendingCreate.promise.catch(() => undefined);
    });

    view.rerender(
      <CreateLayerDialog open onCreated={vi.fn()} onOpenChange={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Layer name")).toHaveValue("");
      expect(
        screen.queryByText("Error: Layer already exists"),
      ).not.toBeInTheDocument();
    });
  });

  it("runs success callbacks under StrictMode", async () => {
    const user = userEvent.setup();
    const pendingCreate = createDeferred<void>();
    const onCreated = vi.fn();
    const onOpenChange = vi.fn();

    mutateAsyncMock.mockReturnValue(pendingCreate.promise);

    render(
      <StrictMode>
        <CreateLayerDialog
          open
          onCreated={onCreated}
          onOpenChange={onOpenChange}
        />
      </StrictMode>,
    );

    await user.type(screen.getByPlaceholderText("Layer name"), "Layer Alpha");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await act(async () => {
      pendingCreate.resolve();
      await pendingCreate.promise;
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onCreated).toHaveBeenCalledWith("Layer Alpha");
    });
  });
});
