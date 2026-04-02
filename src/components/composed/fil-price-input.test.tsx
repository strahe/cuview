import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FilPriceInput } from "./fil-price-input";

vi.mock("@/components/ui/input-group", () => ({
  InputGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  InputGroupAddon: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  InputGroupInput: (props: ComponentProps<"input">) => <input {...props} />,
  InputGroupText: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
}));

describe("FilPriceInput", () => {
  it("keeps typed decimal input instead of snapping back to a reformatted value", () => {
    function Harness() {
      const [value, setValue] = useState(0);

      return <FilPriceInput onChange={setValue} value={value} />;
    }

    render(<Harness />);

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "0.1" } });

    expect(input).toHaveDisplayValue("0.1");
  });

  it("forwards form control props to the underlying input", () => {
    const handleBlur = vi.fn();

    render(
      <FilPriceInput
        aria-invalid
        className="price-wrapper"
        disabled
        id="price"
        name="price"
        onBlur={handleBlur}
        onChange={vi.fn()}
        value={0}
      />,
    );

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("id", "price");
    expect(input).toHaveAttribute("name", "price");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/attoFIL\/GiB\/Epoch/).parentElement).toHaveClass(
      "price-wrapper",
    );

    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
});
