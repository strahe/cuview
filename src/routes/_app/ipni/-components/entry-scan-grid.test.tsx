import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IpniEntryInfo } from "@/types/ipni";
import { EntryScanGrid } from "./entry-scan-grid";

const { mockState } = vi.hoisted(() => {
  const call = vi.fn();

  return {
    mockState: {
      api: {
        call,
      },
    },
  };
});

vi.mock("@/contexts/curio-api-context", () => ({
  useCurioApi: () => mockState.api,
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function makeEntryInfo(overrides: Partial<IpniEntryInfo> = {}): IpniEntryInfo {
  return {
    PieceCID: "bafy-piece",
    FromCar: false,
    NumBlocks: 1,
    Size: 128,
    PrevCID: null,
    Err: null,
    ...overrides,
  };
}

describe("EntryScanGrid", () => {
  beforeEach(() => {
    mockState.api.call.mockReset();
  });

  it("keeps stale scan results from overwriting the latest scan", async () => {
    const oldHead = "old-scan-cid-1234567890";
    const newHead = "new-scan-cid-0987654321";
    const oldScan = createDeferred<IpniEntryInfo>();
    const newScan = createDeferred<IpniEntryInfo>();

    mockState.api.call.mockImplementation(
      (_method: string, [cid]: [string]) => {
        if (cid === oldHead) {
          return oldScan.promise;
        }

        if (cid === newHead) {
          return newScan.promise;
        }

        throw new Error(`Unexpected CID: ${cid}`);
      },
    );

    const view = render(<EntryScanGrid entriesHead={oldHead} entryCount={1} />);

    view.rerender(<EntryScanGrid entriesHead={newHead} entryCount={1} />);

    await act(async () => {
      newScan.resolve(makeEntryInfo());
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTitle(/new-scan-cid-098/i)).toBeInTheDocument();
    });

    await act(async () => {
      oldScan.resolve(makeEntryInfo());
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTitle(/new-scan-cid-098/i)).toBeInTheDocument();
    });

    expect(screen.queryByTitle(/old-scan-cid-123/i)).not.toBeInTheDocument();
  });

  it("caps very large scans and keeps pending cells out of the tab order", async () => {
    mockState.api.call.mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <EntryScanGrid entriesHead="bafy-entry-head" entryCount={1005} />,
    );

    expect(
      screen.getByText(/showing first 1,000 of 1,005 entries/i),
    ).toBeInTheDocument();
    expect(container.querySelector(".overflow-x-auto")).not.toBeNull();

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons).toHaveLength(1000);

    const secondButton = buttons[1];
    if (!(secondButton instanceof HTMLButtonElement)) {
      throw new Error("Expected the second grid cell to be a button");
    }

    expect(secondButton).toHaveAttribute(
      "aria-label",
      "Entry 2, not scanned yet",
    );
    expect(secondButton).toBeDisabled();
  });
});
