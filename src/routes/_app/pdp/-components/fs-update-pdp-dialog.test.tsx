import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FSPDPOffering } from "../-module/types";
import { FsUpdatePdpDialog } from "./fs-update-pdp-dialog";

type MutationState = {
  error: Error | null;
  isError: boolean;
  isPending: boolean;
};

const { mutateMock, mutationControls } = vi.hoisted(() => {
  return {
    mutateMock: vi.fn(),
    mutationControls: {
      setState: null as null | ((state: MutationState) => void),
    },
  };
});

vi.mock("../-module/queries", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  const cleanState: MutationState = {
    error: null,
    isError: false,
    isPending: false,
  };

  return {
    useFsUpdatePdp: () => {
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

const baseOffering: FSPDPOffering = {
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
};

describe("FsUpdatePdpDialog", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    mutationControls.setState = null;
  });

  it("initializes the form from current when mounted open", () => {
    render(
      <FsUpdatePdpDialog current={baseOffering} onOpenChange={vi.fn()} open />,
    );

    expect(screen.getByPlaceholderText("https://example.com/pdp")).toHaveValue(
      "https://old.example.com/pdp",
    );
  });

  it("resets the form from the latest current value when opened", () => {
    const { rerender } = render(
      <FsUpdatePdpDialog
        current={baseOffering}
        onOpenChange={vi.fn()}
        open={false}
      />,
    );

    rerender(
      <FsUpdatePdpDialog
        current={{
          ...baseOffering,
          service_url: "https://new.example.com/pdp",
        }}
        onOpenChange={vi.fn()}
        open
      />,
    );

    expect(screen.getByPlaceholderText("https://example.com/pdp")).toHaveValue(
      "https://new.example.com/pdp",
    );
  });

  it("does not overwrite edits when current changes while open", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <FsUpdatePdpDialog current={baseOffering} onOpenChange={vi.fn()} open />,
    );

    const serviceUrl = screen.getByPlaceholderText("https://example.com/pdp");
    await user.clear(serviceUrl);
    await user.type(serviceUrl, "https://draft.example.com/pdp");

    rerender(
      <FsUpdatePdpDialog
        current={{
          ...baseOffering,
          service_url: "https://polled.example.com/pdp",
        }}
        onOpenChange={vi.fn()}
        open
      />,
    );

    expect(screen.getByPlaceholderText("https://example.com/pdp")).toHaveValue(
      "https://draft.example.com/pdp",
    );
  });

  it("submits from Enter in the service URL field", async () => {
    const user = userEvent.setup();
    render(
      <FsUpdatePdpDialog current={baseOffering} onOpenChange={vi.fn()} open />,
    );

    screen.getByPlaceholderText("https://example.com/pdp").focus();
    await user.keyboard("{Enter}");

    expect(mutateMock).toHaveBeenCalledWith([baseOffering, null], {
      onSuccess: expect.any(Function),
    });
  });

  it("ignores duplicate submits while an update is pending", () => {
    render(
      <FsUpdatePdpDialog current={baseOffering} onOpenChange={vi.fn()} open />,
    );

    const serviceUrl = screen.getByPlaceholderText("https://example.com/pdp");
    const form = serviceUrl.closest("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form!);
    fireEvent.submit(form!);

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(serviceUrl).toBeDisabled();
  });

  it("keeps pending state when reopened during an update", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <FsUpdatePdpDialog current={baseOffering} onOpenChange={vi.fn()} open />,
    );

    await user.click(screen.getByRole("button", { name: "Update PDP" }));

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Updating/ })).toBeDisabled();

    rerender(
      <FsUpdatePdpDialog
        current={baseOffering}
        onOpenChange={vi.fn()}
        open={false}
      />,
    );
    rerender(
      <FsUpdatePdpDialog current={baseOffering} onOpenChange={vi.fn()} open />,
    );

    expect(screen.getByRole("button", { name: /Updating/ })).toBeDisabled();
  });

  it("does not close a later dialog instance when an earlier update succeeds", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <FsUpdatePdpDialog
        current={baseOffering}
        onOpenChange={onOpenChange}
        open
      />,
    );

    await user.click(screen.getByRole("button", { name: "Update PDP" }));

    rerender(
      <FsUpdatePdpDialog
        current={baseOffering}
        onOpenChange={onOpenChange}
        open={false}
      />,
    );
    rerender(
      <FsUpdatePdpDialog
        current={baseOffering}
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
      <FsUpdatePdpDialog current={baseOffering} onOpenChange={vi.fn()} open />,
    );

    act(() => {
      mutationControls.setState?.({
        error: new Error("Failed to update PDP"),
        isError: true,
        isPending: false,
      });
    });

    expect(await screen.findByText("Failed to update PDP")).toBeVisible();

    rerender(
      <FsUpdatePdpDialog
        current={baseOffering}
        onOpenChange={vi.fn()}
        open={false}
      />,
    );
    rerender(
      <FsUpdatePdpDialog current={baseOffering} onOpenChange={vi.fn()} open />,
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Failed to update PDP"),
      ).not.toBeInTheDocument();
    });
  });
});
