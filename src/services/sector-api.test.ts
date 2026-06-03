import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CurioApiService } from "@/services/curio-api";
import type { SectorListItem } from "@/types/sectors";
import { fetchSectors, normalizeSectorListResponse } from "./sector-api";

describe("sector api", () => {
  const sector = {
    MinerID: 1000,
    SectorNum: 42,
    MinerAddress: "f01000",
    HasSealed: true,
    HasUnsealed: false,
    HasSnap: false,
    ExpiresAt: 100,
    IsOnChain: true,
    IsFilPlus: false,
    SealInfo: "sealed",
    Proving: true,
    Flag: false,
    DealWeight: "0",
    Deals: "",
  } satisfies SectorListItem;

  const restGet = vi.fn();
  const api = { restGet } as unknown as CurioApiService;

  beforeEach(() => {
    restGet.mockReset();
  });

  it("unwraps Curio v1.28.1 sector list responses", () => {
    expect(normalizeSectorListResponse({ data: [sector] })).toEqual([sector]);
    expect(normalizeSectorListResponse(null)).toEqual([]);
  });

  it("fetches sectors from the v1.28.1 REST path", async () => {
    const signal = new AbortController().signal;
    restGet.mockResolvedValue({ data: [sector] });

    await expect(fetchSectors(api, signal)).resolves.toEqual([sector]);

    expect(restGet).toHaveBeenCalledWith("/api/sector/all", { signal });
  });
});
