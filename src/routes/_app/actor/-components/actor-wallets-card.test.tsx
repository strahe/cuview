import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { WalletInfo } from "@/types/actor";
import { ActorWalletsCard } from "./actor-wallets-card";

vi.mock("./copy-button", () => ({
  CopyButton: () => <button type="button">copy</button>,
}));

describe("ActorWalletsCard", () => {
  it("renders long wallet addresses in a truncation-safe layout", () => {
    const address =
      "f410f4zlongwalletaddress0123456789012345678901234567890123456789";
    const wallets: WalletInfo[] = [
      {
        Type: "Owner",
        Address: address,
        Balance: "1230000000000000000",
      },
    ];

    const { container } = render(
      <TooltipProvider>
        <ActorWalletsCard wallets={wallets} />
      </TooltipProvider>,
    );

    const addressNode = container.querySelector(
      "span[data-slot='tooltip-trigger']",
    );
    expect(addressNode).not.toBeNull();
    expect(addressNode).toHaveTextContent(address);
    expect(addressNode).toHaveClass("truncate");
    expect(addressNode).toHaveClass("min-w-0");
    expect(container.querySelector(".min-w-0")).not.toBeNull();
  });
});
