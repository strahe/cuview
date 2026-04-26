import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FSPDPOffering } from "../-module/types";
import { FsUpdatePdpDialog } from "./fs-update-pdp-dialog";

const { mutation, useFsUpdatePdpMock } = vi.hoisted(() => {
  const mutation = {
    error: null,
    isError: false,
    isPending: false,
    mutate: vi.fn(),
    reset: vi.fn(),
  };

  return {
    mutation,
    useFsUpdatePdpMock: vi.fn(() => mutation),
  };
});

vi.mock("../-module/queries", () => ({
  useFsUpdatePdp: useFsUpdatePdpMock,
}));

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
    mutation.mutate.mockReset();
    mutation.reset.mockReset();
    useFsUpdatePdpMock.mockClear();
  });

  it("initializes the form from current when mounted open", () => {
    render(
      <FsUpdatePdpDialog current={baseOffering} onOpenChange={vi.fn()} open />,
    );

    expect(screen.getByPlaceholderText("https://example.com/pdp")).toHaveValue(
      "https://old.example.com/pdp",
    );
    expect(mutation.reset).toHaveBeenCalledTimes(1);
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
    expect(mutation.reset).toHaveBeenCalledTimes(1);
  });
});
