import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as queries from "./queries";

const {
  useCurioApiMock,
  useCurioConnectionMock,
  useMutationMock,
  useQueryMock,
} = vi.hoisted(() => ({
  useCurioApiMock: vi.fn(),
  useCurioConnectionMock: vi.fn(),
  useMutationMock: vi.fn(),
  useQueryMock: vi.fn(),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );

  return {
    ...actual,
    useMutation: useMutationMock,
    useQuery: useQueryMock,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock("@/contexts/curio-api-context", () => ({
  useCurioApi: useCurioApiMock,
  useCurioConnection: useCurioConnectionMock,
}));

describe("config queries", () => {
  beforeEach(() => {
    useCurioApiMock.mockReset();
    useCurioConnectionMock.mockReset();
    useMutationMock.mockReset();
    useQueryMock.mockReset();

    useCurioApiMock.mockReturnValue({ restGet: vi.fn() });
    useCurioConnectionMock.mockReturnValue({
      endpoint: "https://curio.example",
    });
  });

  it("preserves numeric RAM values when normalizing topology responses", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          ID: "node-1",
          Name: "Worker Alpha",
          LayersCSV: "base, sealing",
          RAM: 16 * 1024 ** 3,
        },
      ],
      error: null,
      isError: false,
      isLoading: false,
    });

    const { result } = renderHook(() => queries.useConfigTopology());

    expect(result.current.data).toEqual([
      expect.objectContaining({
        id: "node-1",
        layers: ["base", "sealing"],
        name: "Worker Alpha",
        ram: 16 * 1024 ** 3,
      }),
    ]);
  });

  it("preserves preformatted RAM strings when normalizing topology responses", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          ID: "node-2",
          Name: "Worker Beta",
          LayersCSV: "compute",
          RAM: "16GiB",
        },
      ],
      error: null,
      isError: false,
      isLoading: false,
    });

    const { result } = renderHook(() => queries.useConfigTopology());

    expect(result.current.data).toEqual([
      expect.objectContaining({
        id: "node-2",
        layers: ["compute"],
        name: "Worker Beta",
        ram: "16GiB",
      }),
    ]);
  });
});
