import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsSection } from "./products-section";

const productsState = {
  products: {} as Record<string, boolean>,
  dataSources: {} as Record<string, boolean>,
  contracts: {} as Record<string, boolean>,
};

const addContractMutate = vi.fn();
const updateContractMutate = vi.fn();
const removeContractMutate = vi.fn();

vi.mock("../-module/queries", () => ({
  useProducts: () => ({ data: productsState.products }),
  useEnableProduct: () => ({ mutate: vi.fn(), isPending: false }),
  useDisableProduct: () => ({ mutate: vi.fn(), isPending: false }),
  useDataSources: () => ({ data: productsState.dataSources }),
  useEnableDataSource: () => ({ mutate: vi.fn(), isPending: false }),
  useDisableDataSource: () => ({ mutate: vi.fn(), isPending: false }),
  useContracts: () => ({ data: productsState.contracts }),
  useAddContract: () => ({ mutate: addContractMutate, isPending: false }),
  useUpdateContract: () => ({
    mutate: updateContractMutate,
    isPending: false,
  }),
  useRemoveContract: () => ({
    mutate: removeContractMutate,
    isPending: false,
  }),
}));

describe("ProductsSection market contracts", () => {
  beforeEach(() => {
    productsState.products = {};
    productsState.dataSources = {};
    productsState.contracts = {};
    addContractMutate.mockReset();
    updateContractMutate.mockReset();
    removeContractMutate.mockReset();
    addContractMutate.mockImplementation((_params, options) => {
      options?.onSuccess?.();
    });
  });

  it("renders v1.27.4 contract allowed state without ABI text", () => {
    productsState.contracts = {
      "0x1111111111111111111111111111111111111111": true,
      "0x2222222222222222222222222222222222222222": false,
    };

    render(<ProductsSection />);

    expect(screen.getByText("Allowed")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.queryByText(/ABI:/i)).not.toBeInTheDocument();
  });

  it("adds contracts as allowed by default and updates allowed state", () => {
    productsState.contracts = {
      "0x2222222222222222222222222222222222222222": false,
    };

    render(<ProductsSection />);

    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    fireEvent.change(screen.getByPlaceholderText("0x..."), {
      target: { value: "0x3333333333333333333333333333333333333333" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(addContractMutate).toHaveBeenCalledWith(
      ["0x3333333333333333333333333333333333333333", true],
      expect.any(Object),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /allow contract 0x2222222222222222222222222222222222222222/i,
      }),
    );

    expect(updateContractMutate).toHaveBeenCalledWith([
      "0x2222222222222222222222222222222222222222",
      true,
    ]);

    fireEvent.click(
      screen.getByRole("button", {
        name: /remove contract 0x2222222222222222222222222222222222222222/i,
      }),
    );

    expect(removeContractMutate).toHaveBeenCalledWith([
      "0x2222222222222222222222222222222222222222",
    ]);
  });
});
