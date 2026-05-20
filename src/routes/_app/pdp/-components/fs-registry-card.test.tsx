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
import type { FSRegistryStatus } from "../-module/types";
import { FsRegistryCard } from "./fs-registry-card";

type MutationState = {
  error: Error | null;
  isError: boolean;
  isPending: boolean;
};

const { deregisterMutateMock, deregisterControls } = vi.hoisted(() => ({
  deregisterMutateMock: vi.fn(),
  deregisterControls: {
    setState: null as null | ((state: MutationState) => void),
  },
}));

vi.mock("@/components/composed/status-badge", () => ({
  StatusBadge: ({ label }: { label: string }) => <span>{label}</span>,
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

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: ComponentProps<"div">) => (
    <div {...props}>{children}</div>
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

vi.mock("../-module/queries", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  const cleanState: MutationState = {
    error: null,
    isError: false,
    isPending: false,
  };

  return {
    useFsDeregister: () => {
      const [state, setState] = React.useState(cleanState);
      deregisterControls.setState = setState;

      return {
        ...state,
        mutate: (...args: unknown[]) => {
          setState({ ...cleanState, isPending: true });
          deregisterMutateMock(...args);
        },
        reset: () => setState(cleanState),
      };
    },
  };
});

vi.mock("./fs-register-dialog", () => ({
  FsRegisterDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="register-dialog" /> : null,
}));

vi.mock("./fs-update-pdp-dialog", () => ({
  FsUpdatePdpDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="update-pdp-dialog" /> : null,
}));

vi.mock("./fs-update-provider-dialog", () => ({
  FsUpdateProviderDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="update-provider-dialog" /> : null,
}));

const activeStatus: FSRegistryStatus = {
  address: "f01234",
  capabilities: {},
  description: "Storage provider",
  id: 1234,
  name: "Provider",
  payee: "",
  pdp_service: {
    ipni_ipfs: false,
    ipni_peer_id: "",
    ipni_piece: true,
    location: "US",
    max_size: 2048,
    min_proving_period: 10,
    min_size: 128,
    payment_token_address: "0xabc",
    price: 7,
    service_url: "https://old.example.com/pdp",
  },
  status: true,
};

describe("FsRegistryCard", () => {
  beforeEach(() => {
    deregisterMutateMock.mockReset();
    deregisterControls.setState = null;
  });

  it("closes active-provider dialogs when provider becomes inactive", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FsRegistryCard fsStatus={activeStatus} />);

    await user.click(screen.getByRole("button", { name: "Update Provider" }));
    await user.click(screen.getByRole("button", { name: "Update PDP" }));
    await user.click(screen.getByRole("button", { name: "Deregister" }));

    expect(screen.getByTestId("update-provider-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("update-pdp-dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Deregister Provider" }),
    ).toBeInTheDocument();

    rerender(<FsRegistryCard fsStatus={{ ...activeStatus, status: false }} />);

    expect(
      screen.queryByTestId("update-provider-dialog"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("update-pdp-dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Deregister Provider" }),
    ).not.toBeInTheDocument();

    rerender(<FsRegistryCard fsStatus={activeStatus} />);

    expect(
      screen.queryByTestId("update-provider-dialog"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("update-pdp-dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Deregister Provider" }),
    ).not.toBeInTheDocument();
  });

  it("closes active-provider dialogs when provider status becomes null", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FsRegistryCard fsStatus={activeStatus} />);

    await user.click(screen.getByRole("button", { name: "Update Provider" }));
    await user.click(screen.getByRole("button", { name: "Update PDP" }));
    await user.click(screen.getByRole("button", { name: "Deregister" }));

    expect(screen.getByTestId("update-provider-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("update-pdp-dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Deregister Provider" }),
    ).toBeInTheDocument();

    rerender(<FsRegistryCard fsStatus={null} />);

    expect(
      screen.queryByTestId("update-provider-dialog"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("update-pdp-dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Deregister Provider" }),
    ).not.toBeInTheDocument();

    rerender(<FsRegistryCard fsStatus={activeStatus} />);

    expect(
      screen.queryByTestId("update-provider-dialog"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("update-pdp-dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Deregister Provider" }),
    ).not.toBeInTheDocument();
  });

  it("closes the register dialog when provider becomes active", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <FsRegistryCard fsStatus={{ ...activeStatus, status: false }} />,
    );

    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(screen.getByTestId("register-dialog")).toBeInTheDocument();

    rerender(<FsRegistryCard fsStatus={activeStatus} />);

    expect(screen.queryByTestId("register-dialog")).not.toBeInTheDocument();

    rerender(<FsRegistryCard fsStatus={{ ...activeStatus, status: false }} />);

    expect(screen.queryByTestId("register-dialog")).not.toBeInTheDocument();
  });

  it("submits deregister and closes on success", async () => {
    const user = userEvent.setup();
    render(<FsRegistryCard fsStatus={activeStatus} />);

    await user.click(screen.getByRole("button", { name: "Deregister" }));

    expect(
      screen.getByRole("heading", { name: "Deregister Provider" }),
    ).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", {
      name: "Deregister",
    });
    await user.click(confirmButtons[confirmButtons.length - 1]!);

    expect(deregisterMutateMock).toHaveBeenCalledWith([], {
      onSuccess: expect.any(Function),
    });

    const [, options] = deregisterMutateMock.mock.calls[0] as [
      unknown,
      { onSuccess: () => void },
    ];
    act(() => options.onSuccess());

    expect(
      screen.queryByRole("heading", { name: "Deregister Provider" }),
    ).not.toBeInTheDocument();
  });

  it("keeps deregister pending state when reopened", async () => {
    const user = userEvent.setup();
    render(<FsRegistryCard fsStatus={activeStatus} />);

    await user.click(screen.getByRole("button", { name: "Deregister" }));

    const confirmButtons = screen.getAllByRole("button", {
      name: "Deregister",
    });
    await user.click(confirmButtons[confirmButtons.length - 1]!);

    expect(deregisterMutateMock).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Deregistering…" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Deregister" }));

    expect(
      screen.getByRole("button", { name: "Deregistering…" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Deregistering…" }));
    expect(deregisterMutateMock).toHaveBeenCalledTimes(1);
  });

  it("does not close a later deregister dialog when an earlier request succeeds", async () => {
    const user = userEvent.setup();
    render(<FsRegistryCard fsStatus={activeStatus} />);

    await user.click(screen.getByRole("button", { name: "Deregister" }));

    const confirmButtons = screen.getAllByRole("button", {
      name: "Deregister",
    });
    await user.click(confirmButtons[confirmButtons.length - 1]!);

    const [, options] = deregisterMutateMock.mock.calls[0] as [
      unknown,
      { onSuccess: () => void },
    ];

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Deregister" }));

    act(() => options.onSuccess());

    expect(
      screen.getByRole("heading", { name: "Deregister Provider" }),
    ).toBeInTheDocument();
  });

  it("clears stale deregister error state when reopened", async () => {
    const user = userEvent.setup();
    render(<FsRegistryCard fsStatus={activeStatus} />);

    await user.click(screen.getByRole("button", { name: "Deregister" }));

    act(() => {
      deregisterControls.setState?.({
        error: new Error("Failed to deregister"),
        isError: true,
        isPending: false,
      });
    });

    expect(await screen.findByText("Failed to deregister")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Deregister" }));

    await waitFor(() => {
      expect(
        screen.queryByText("Failed to deregister"),
      ).not.toBeInTheDocument();
    });
  });
});
