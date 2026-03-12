import { describe, expect, it } from "vitest";
import {
  DEFAULT_STORAGE_GC_SEARCH,
  DEFAULT_STORAGE_PATH_DETAIL_SEARCH,
  DEFAULT_STORAGE_PATHS_SEARCH,
  normalizeStorageGcSearch,
  normalizeStoragePathDetailSearch,
  normalizeStoragePathsSearch,
  patchStorageGcSearch,
  patchStoragePathDetailSearch,
} from "./search-state";

describe("storage search state", () => {
  it("normalizes path filters and falls back on invalid values", () => {
    expect(
      normalizeStoragePathsSearch({
        q: "  worker-01  ",
        capability: "both",
        health: "broken",
      }),
    ).toEqual({
      q: "worker-01",
      capability: "both",
      health: "all",
    });
  });

  it("normalizes gc filters and rejects invalid paging values", () => {
    expect(
      normalizeStorageGcSearch({
        miner: "  f01234 ",
        sectorNum: "42",
        limit: "999",
        offset: "-10",
      }),
    ).toEqual({
      miner: "f01234",
      sectorNum: 42,
      limit: 200,
      offset: 0,
    });

    expect(
      normalizeStorageGcSearch({
        miner: 123,
        sectorNum: "0",
        limit: "oops",
      }),
    ).toEqual(DEFAULT_STORAGE_GC_SEARCH);
  });

  it("coerces numeric paging values to integers", () => {
    expect(
      normalizeStorageGcSearch({
        sectorNum: 9.8,
        limit: 12.4,
        offset: 1.9,
      }),
    ).toEqual({
      miner: "",
      sectorNum: 9,
      limit: 12,
      offset: 1,
    });

    expect(
      normalizeStoragePathDetailSearch({
        limit: 24.8,
        offset: 3.1,
      }),
    ).toEqual({
      ...DEFAULT_STORAGE_PATHS_SEARCH,
      limit: 24,
      offset: 3,
    });
  });

  it("resets gc offset when filters change", () => {
    const next = patchStorageGcSearch(
      {
        ...DEFAULT_STORAGE_GC_SEARCH,
        offset: 150,
      },
      { miner: "f0999" },
    );

    expect(next.offset).toBe(0);
    expect(next.miner).toBe("f0999");
  });

  it("resets sector paging when page size changes", () => {
    const next = patchStoragePathDetailSearch(
      {
        ...DEFAULT_STORAGE_PATH_DETAIL_SEARCH,
        offset: 100,
      },
      { limit: 20 },
    );

    expect(next).toEqual({
      q: "",
      capability: "all",
      health: "all",
      limit: 20,
      offset: 0,
    });
  });

  it("normalizes direct detail links with inherited path filters", () => {
    expect(
      normalizeStoragePathDetailSearch({
        q: " worker-02 ",
        capability: "store",
        health: "degraded",
        limit: "20",
        offset: "40",
      }),
    ).toEqual({
      q: "worker-02",
      capability: "store",
      health: "degraded",
      limit: 20,
      offset: 40,
    });
  });

  it("keeps default path search state stable", () => {
    expect(normalizeStoragePathsSearch({})).toEqual(
      DEFAULT_STORAGE_PATHS_SEARCH,
    );
  });
});
