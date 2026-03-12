import { describe, expect, it } from "vitest";
import {
  getMachineIdForHost,
  normalizeStorageGcMarksResponse,
  normalizeStorageHost,
  normalizeStoragePathDetailResponse,
  normalizeStoragePathSectorsResponse,
  withStorageEndpointQueryKey,
} from "./queries";
import { storageQueryKeys } from "./query-keys";

describe("storage queries", () => {
  it("normalizes null gc marks payloads", () => {
    expect(normalizeStorageGcMarksResponse(null)).toEqual({
      Marks: [],
      Total: 0,
    });

    expect(
      normalizeStorageGcMarksResponse({
        Marks: null,
        Total: 12,
      }),
    ).toEqual({
      Marks: [],
      Total: 12,
    });
  });

  it("normalizes nullable storage path detail arrays", () => {
    expect(normalizeStoragePathDetailResponse(null)).toBeNull();

    expect(
      normalizeStoragePathDetailResponse({
        Info: {
          StorageID: "storage-001",
          PathType: "Seal",
          CapacityStr: "10 GiB",
          AvailableStr: "8 GiB",
          UsedStr: "2 GiB",
          UsedPercent: 20,
          HealthStatus: "healthy",
          HealthOK: true,
        },
        URLs: null,
        GCMarks: null,
        TotalSectorEntries: 0,
        PrimaryEntries: 0,
        SecondaryEntries: 0,
        ByType: null,
        ByMiner: null,
        PendingGC: 0,
        ApprovedGC: 0,
      }),
    ).toMatchObject({
      URLs: [],
      GCMarks: [],
      ByType: [],
      ByMiner: [],
    });
  });

  it("normalizes nullable storage path sectors payloads", () => {
    expect(
      normalizeStoragePathSectorsResponse({
        Sectors: null,
        Total: 9,
      }),
    ).toEqual({
      Sectors: [],
      Total: 9,
    });
  });

  it("normalizes hosts before looking up machine ids", () => {
    expect(normalizeStorageHost(" worker-01 ")).toBe("worker-01");
    expect(
      getMachineIdForHost(
        {
          "worker-01": 7,
        },
        " worker-01 ",
      ),
    ).toBe(7);
    expect(getMachineIdForHost({}, "   ")).toBeUndefined();
  });

  it("places endpoint before params in storage query keys", () => {
    expect(
      withStorageEndpointQueryKey(
        storageQueryKeys.pathSectors("storage-001", 50, 100),
        "https://curio.example",
      ),
    ).toEqual([
      "curio",
      "StoragePathSectors",
      "https://curio.example",
      "storage-001",
      50,
      100,
    ]);
  });
});
