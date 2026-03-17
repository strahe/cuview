import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentSearch: Record<string, string | undefined> = {};
const navigateMock = vi.fn();
const useGetAdMock = vi.fn();
const useIpniEntryMock = vi.fn();
const skipMutateMock = vi.fn();
let adErrorMessage: string | null = null;

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    ...options,
    useSearch: () =>
      typeof options.validateSearch === "function"
        ? options.validateSearch(currentSearch)
        : currentSearch,
    useNavigate: () => navigateMock,
  }),
}));

vi.mock("./-module/queries", () => ({
  useGetAd: (cid: string | null) => {
    useGetAdMock(cid);
    return {
      error: adErrorMessage ? new Error(adErrorMessage) : null,
      data:
        cid && !adErrorMessage
          ? {
              ad_cid: cid,
              entries: null,
              entry_count: 0,
              is_skip: false,
            }
          : undefined,
      isError: Boolean(adErrorMessage),
      isLoading: false,
    };
  },
  useIpniEntry: (cid: string | null) => {
    useIpniEntryMock(cid);
    return {
      data: cid
        ? {
            PieceCID: "bafy-piece",
            FromCar: false,
            FirstCID: "bafy-first",
            StartOffset: 0,
            NumBlocks: 1,
            PrevCID: null,
            Err: "",
            Size: 128,
          }
        : undefined,
      isLoading: false,
    };
  },
  useIpniSetSkip: () => ({
    mutate: skipMutateMock,
    isPending: false,
  }),
}));

vi.mock("./-components/ad-detail-card", () => ({
  AdDetailCard: ({ ad }: { ad: { ad_cid: string } }) => (
    <div data-testid="ad-detail-card">{ad.ad_cid}</div>
  ),
}));

vi.mock("./-components/entry-detail-card", () => ({
  EntryDetailCard: ({ entry }: { entry: { PieceCID: string } }) => (
    <div data-testid="entry-detail-card">{entry.PieceCID}</div>
  ),
}));

vi.mock("./-components/entry-scan-grid", () => ({
  EntryScanGrid: () => <div data-testid="entry-scan-grid" />,
}));

async function renderSearchPage() {
  const { Route } = await import("./search");
  const SearchPage = (Route as unknown as { component: () => ReactNode })
    .component;
  return { ...render(<SearchPage />), SearchPage };
}

describe("IPNI SearchPage", () => {
  beforeEach(() => {
    currentSearch = {};
    navigateMock.mockReset();
    useGetAdMock.mockReset();
    useIpniEntryMock.mockReset();
    skipMutateMock.mockReset();
    adErrorMessage = null;
  });

  it("keeps the advertisement input in sync when the cid search param changes", async () => {
    currentSearch = { cid: "bafy-ad-1" };

    const view = await renderSearchPage();

    expect(
      screen.getByPlaceholderText("Enter Ad CID or Entry CID (bafy...)"),
    ).toHaveValue("bafy-ad-1");
    expect(useGetAdMock).toHaveBeenLastCalledWith("bafy-ad-1");

    currentSearch = { cid: "bafy-ad-2" };
    view.rerender(<view.SearchPage />);

    expect(
      screen.getByPlaceholderText("Enter Ad CID or Entry CID (bafy...)"),
    ).toHaveValue("bafy-ad-2");
  });

  it("supports entry lookup as a first-class deep link via search params", async () => {
    currentSearch = { entryCid: "bafy-entry-1" };

    await renderSearchPage();

    expect(
      screen.getByPlaceholderText("Enter entry block CID (bafy...)"),
    ).toHaveValue("bafy-entry-1");
    expect(useIpniEntryMock).toHaveBeenLastCalledWith("bafy-entry-1");
    expect(screen.getByTestId("entry-detail-card")).toHaveTextContent(
      "bafy-piece",
    );
  });

  it("keeps cid and entryCid mutually exclusive when both appear in the URL", async () => {
    currentSearch = {
      cid: "bafy-ad-1",
      entryCid: "bafy-entry-1",
    };

    await renderSearchPage();

    expect(
      screen.getByPlaceholderText("Enter Ad CID or Entry CID (bafy...)"),
    ).toHaveValue("bafy-ad-1");
    expect(
      screen.getByPlaceholderText("Enter entry block CID (bafy...)"),
    ).toHaveValue("");
    expect(useGetAdMock).toHaveBeenLastCalledWith("bafy-ad-1");
    expect(useIpniEntryMock).toHaveBeenLastCalledWith(null);
    expect(screen.queryByTestId("entry-detail-card")).not.toBeInTheDocument();
  });

  it("writes the entry lookup back into the URL when the user searches manually", async () => {
    const user = userEvent.setup();

    await renderSearchPage();

    await user.type(
      screen.getByPlaceholderText("Enter entry block CID (bafy...)"),
      "bafy-entry-2",
    );
    const [, entrySearchButton] = screen.getAllByRole("button", {
      name: "Search",
    });
    if (!entrySearchButton) {
      throw new Error("Expected entry search button to exist");
    }
    await user.click(entrySearchButton);

    expect(navigateMock).toHaveBeenCalledWith({
      search: { cid: undefined, entryCid: "bafy-entry-2" },
    });
  });

  it("clears the active ad search when switching to an entry lookup", async () => {
    const user = userEvent.setup();
    currentSearch = { cid: "bafy-old-ad" };

    await renderSearchPage();

    await user.clear(
      screen.getByPlaceholderText("Enter entry block CID (bafy...)"),
    );
    await user.type(
      screen.getByPlaceholderText("Enter entry block CID (bafy...)"),
      "bafy-entry-3",
    );
    const [, entrySearchButton] = screen.getAllByRole("button", {
      name: "Search",
    });
    if (!entrySearchButton) {
      throw new Error("Expected entry search button to exist");
    }
    await user.click(entrySearchButton);

    expect(navigateMock).toHaveBeenCalledWith({
      search: { cid: undefined, entryCid: "bafy-entry-3" },
    });
  });

  it("clears the active entry search when switching back to an advertisement lookup", async () => {
    const user = userEvent.setup();
    currentSearch = { entryCid: "bafy-old-entry" };

    await renderSearchPage();

    await user.clear(
      screen.getByPlaceholderText("Enter Ad CID or Entry CID (bafy...)"),
    );
    await user.type(
      screen.getByPlaceholderText("Enter Ad CID or Entry CID (bafy...)"),
      "bafy-ad-3",
    );
    const [adSearchButton] = screen.getAllByRole("button", { name: "Search" });
    if (!adSearchButton) {
      throw new Error("Expected ad search button to exist");
    }
    await user.click(adSearchButton);

    expect(navigateMock).toHaveBeenCalledWith({
      search: { cid: "bafy-ad-3", entryCid: undefined },
    });
  });

  it("shows a visible error when advertisement lookup fails", async () => {
    adErrorMessage = "ad lookup failed";
    currentSearch = { cid: "bafy-missing-ad" };

    await renderSearchPage();

    expect(screen.getByRole("alert")).toHaveTextContent("ad lookup failed");
  });
});
