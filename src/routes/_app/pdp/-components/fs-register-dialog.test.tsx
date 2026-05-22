import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FsRegisterDialog } from "./fs-register-dialog";

type MutationState = {
  error: Error | null;
  isError: boolean;
  isPending: boolean;
};

const { registerControls, registerMutateMock } = vi.hoisted(() => ({
  registerControls: {
    setState: null as null | ((state: MutationState) => void),
  },
  registerMutateMock: vi.fn(),
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
    useFsRegister: () => {
      const [state, setState] = React.useState(cleanState);
      registerControls.setState = setState;

      return {
        ...state,
        mutate: (...args: unknown[]) => {
          setState({ ...cleanState, isPending: true });
          registerMutateMock(...args);
        },
        reset: () => setState(cleanState),
      };
    },
  };
});

function ControlledRegisterDialog() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button type="button" onClick={() => setOpen(false)}>
        External close
      </button>
      <button type="button" onClick={() => setOpen(true)}>
        External open
      </button>
      <FsRegisterDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

async function fillRegisterForm() {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText("Name"), "Provider A");
  await user.type(screen.getByLabelText("Description"), "A provider");
  await user.type(screen.getByLabelText("Location"), "EU");

  return user;
}

describe("FsRegisterDialog", () => {
  beforeEach(() => {
    registerControls.setState = null;
    registerMutateMock.mockReset();
  });

  it("clears form values after an external close and reopen", async () => {
    const user = await fillRegisterFormAfterRender();

    await user.click(screen.getByRole("button", { name: "External close" }));
    await user.click(screen.getByRole("button", { name: "External open" }));

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(screen.getByLabelText("Location")).toHaveValue("");
  });

  it("clears stale register errors after an external close and reopen", async () => {
    const user = userEvent.setup();
    render(<ControlledRegisterDialog />);

    act(() => {
      registerControls.setState?.({
        error: new Error("Failed to register"),
        isError: true,
        isPending: false,
      });
    });

    expect(await screen.findByText("Failed to register")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "External close" }));
    await user.click(screen.getByRole("button", { name: "External open" }));

    await waitFor(() => {
      expect(screen.queryByText("Failed to register")).not.toBeInTheDocument();
    });
  });

  it("ignores success from a previous register request after reopening", async () => {
    const user = await fillRegisterFormAfterRender();

    await user.click(screen.getByRole("button", { name: "Register" }));

    const [, options] = registerMutateMock.mock.calls[0] as [
      unknown,
      { onSuccess: () => void },
    ];

    await user.click(screen.getByRole("button", { name: "External close" }));
    await user.click(screen.getByRole("button", { name: "External open" }));

    act(() => options.onSuccess());

    expect(
      screen.getByRole("heading", { name: "Register Storage Provider" }),
    ).toBeInTheDocument();
  });
});

async function fillRegisterFormAfterRender() {
  render(<ControlledRegisterDialog />);
  return fillRegisterForm();
}
