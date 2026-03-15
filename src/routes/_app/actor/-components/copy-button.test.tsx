import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CopyButton } from "./copy-button";

describe("CopyButton", () => {
  const writeTextMock = vi.fn();

  beforeEach(() => {
    writeTextMock.mockReset();
    writeTextMock.mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });
  });

  it("stops click propagation and exposes an accessible label", () => {
    const parentClick = vi.fn();

    render(
      <TooltipProvider>
        <div onClick={parentClick}>
          <CopyButton value="f01234" />
        </div>
      </TooltipProvider>,
    );

    const button = screen.getByRole("button", { name: "Copy value" });

    fireEvent.click(button);

    expect(parentClick).not.toHaveBeenCalled();
    expect(writeTextMock).toHaveBeenCalledWith("f01234");
  });
});
