import { render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SizeSelect } from "./size-select";

vi.mock("@/components/ui/select", async () => {
  const React = await import("react");

  const SelectContext = React.createContext<{
    onValueChange?: (value: string) => void;
    value?: string | null;
  } | null>(null);

  return {
    Select: ({
      children,
      value,
      onValueChange,
    }: {
      children: ReactNode;
      onValueChange?: (value: string) => void;
      value?: string | null;
    }) => (
      <SelectContext.Provider value={{ value, onValueChange }}>
        <div>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({
      children,
      ...props
    }: ComponentProps<"button"> & { children: ReactNode }) => (
      <button type="button" role="combobox" aria-expanded="false" {...props}>
        {children}
      </button>
    ),
    SelectValue: ({
      children,
      placeholder,
    }: {
      children?: ReactNode;
      placeholder?: string;
    }) => {
      const context = React.useContext(SelectContext);
      return <span>{children ?? context?.value ?? placeholder ?? ""}</span>;
    },
    SelectContent: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: {
      children: ReactNode;
      value: string;
    }) => {
      const context = React.useContext(SelectContext);

      return (
        <button
          type="button"
          onClick={() => context?.onValueChange?.(value)}
          data-value={value}
        >
          {children}
        </button>
      );
    },
  };
});

describe("SizeSelect", () => {
  it("shows the selected size label instead of the raw numeric value", () => {
    render(<SizeSelect value={128} onChange={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveTextContent("128 B (128 bytes)");
  });
});
