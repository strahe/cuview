import { describe, expect, it } from "vitest";
import type { Deadline, SectorBuckets } from "@/types/actor";
import {
  buildExpirationChartData,
  buildQAPChartData,
  buildVestedFundsChartData,
  formatDeadlineTooltip,
  formatPowerShort,
  formatSectorSize,
  getDeadlineStatus,
} from "./adapters";

const makeDeadline = (overrides: Partial<Deadline> = {}): Deadline => ({
  Empty: true,
  Current: false,
  Proven: false,
  PartFaulty: false,
  Faulty: false,
  PartitionCount: 0,
  PartitionsPosted: 0,
  PartitionsProven: false,
  OpenAt: "",
  ElapsedMinutes: 0,
  ...overrides,
});

describe("getDeadlineStatus", () => {
  it("returns 'empty' for empty deadline", () => {
    expect(getDeadlineStatus(makeDeadline())).toBe("empty");
  });

  it("returns 'proven' for proven deadline", () => {
    expect(
      getDeadlineStatus(makeDeadline({ Proven: true, Empty: false })),
    ).toBe("proven");
  });

  it("returns 'proven' when PartitionsProven is true", () => {
    expect(
      getDeadlineStatus(makeDeadline({ PartitionsProven: true, Empty: false })),
    ).toBe("proven");
  });

  it("returns 'current' for current deadline", () => {
    expect(getDeadlineStatus(makeDeadline({ Current: true }))).toBe("current");
  });

  it("returns 'current-danger' when current + elapsed >= 15min and not proven", () => {
    expect(
      getDeadlineStatus(
        makeDeadline({
          Current: true,
          ElapsedMinutes: 16,
          PartitionsProven: false,
        }),
      ),
    ).toBe("current-danger");
  });

  it("returns 'current' when current + elapsed >= 15min but already proven", () => {
    expect(
      getDeadlineStatus(
        makeDeadline({
          Current: true,
          ElapsedMinutes: 20,
          PartitionsProven: true,
        }),
      ),
    ).toBe("current");
  });

  it("returns 'faulty' for faulty deadline", () => {
    expect(
      getDeadlineStatus(makeDeadline({ Faulty: true, Empty: false })),
    ).toBe("faulty");
  });

  it("returns 'part-faulty' for partially faulty deadline", () => {
    expect(
      getDeadlineStatus(makeDeadline({ PartFaulty: true, Empty: false })),
    ).toBe("part-faulty");
  });

  it("returns 'pending' for non-empty non-proven deadline", () => {
    expect(getDeadlineStatus(makeDeadline({ Empty: false }))).toBe("pending");
  });
});

describe("formatDeadlineTooltip", () => {
  it("includes deadline index", () => {
    const tooltip = formatDeadlineTooltip(makeDeadline(), 5);
    expect(tooltip).toContain("Deadline 5");
  });

  it("marks current deadline", () => {
    const tooltip = formatDeadlineTooltip(makeDeadline({ Current: true }), 0);
    expect(tooltip).toContain("(Current)");
  });

  it("includes partition and sector counts", () => {
    const tooltip = formatDeadlineTooltip(
      makeDeadline({
        PartitionCount: 3,
        Count: { Total: 100, Live: 90, Active: 80, Fault: 5, Recovering: 2 },
      }),
      0,
    );
    expect(tooltip).toContain("Partitions: 3");
    expect(tooltip).toContain("Total: 100");
    expect(tooltip).toContain("Fault: 5");
    expect(tooltip).toContain("Recovering: 2");
  });

  it("includes PoSt submission status", () => {
    const tooltip = formatDeadlineTooltip(
      makeDeadline({ PartitionCount: 4, PartitionsPosted: 2 }),
      0,
    );
    expect(tooltip).toContain("PoSt: 2/4 submitted");
  });

  it("shows elapsed time for current deadline", () => {
    const tooltip = formatDeadlineTooltip(
      makeDeadline({ Current: true, ElapsedMinutes: 10 }),
      0,
    );
    expect(tooltip).toContain("Elapsed: 10min");
  });
});

describe("formatSectorSize", () => {
  it("returns '32 GiB' for 32GiB in bytes", () => {
    expect(formatSectorSize(32 * 1024 ** 3)).toBe("32 GiB");
  });

  it("returns '64 GiB' for 64GiB in bytes", () => {
    expect(formatSectorSize(64 * 1024 ** 3)).toBe("64 GiB");
  });

  it("formats sector sizes larger than 64 GiB without collapsing them", () => {
    expect(formatSectorSize(128 * 1024 ** 3)).toBe("128 GiB");
  });

  it("returns '—' for 0", () => {
    expect(formatSectorSize(0)).toBe("—");
  });
});

describe("formatPowerShort", () => {
  it("formats 0 correctly", () => {
    expect(formatPowerShort("0")).toBe("0 B");
  });

  it("formats TiB values", () => {
    const tib = String(BigInt(1024) ** BigInt(4));
    expect(formatPowerShort(tib)).toBe("1.0 TiB");
  });

  it("formats PiB values", () => {
    const pib = String(BigInt(1024) ** BigInt(5));
    expect(formatPowerShort(pib)).toBe("1.0 PiB");
  });

  it("keeps large values exact without losing precision before formatting", () => {
    const hugeValue = String(2n ** 107n + 31n * 2n ** 54n);
    expect(formatPowerShort(hugeValue)).toBe("140737488355328 EiB");
  });

  it("handles empty string", () => {
    expect(formatPowerShort("")).toBe("0 B");
  });
});

describe("buildExpirationChartData", () => {
  const buckets: SectorBuckets = {
    All: [
      {
        BucketEpoch: 1000,
        Count: 50,
        QAP: "100",
        Days: 10,
        VestedLockedFunds: "0",
      },
      {
        BucketEpoch: 2000,
        Count: 30,
        QAP: "200",
        Days: 20,
        VestedLockedFunds: "0",
      },
    ],
    CC: [
      {
        BucketEpoch: 1000,
        Count: 20,
        QAP: "50",
        Days: 10,
        VestedLockedFunds: "0",
      },
    ],
  };

  it("merges All and CC buckets", () => {
    const result = buildExpirationChartData(buckets);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ label: "10d", days: 10, all: 50, cc: 20 });
    expect(result[1]).toEqual({ label: "20d", days: 20, all: 30, cc: 0 });
  });

  it("handles empty buckets", () => {
    const result = buildExpirationChartData({ All: [], CC: [] });
    expect(result).toHaveLength(0);
  });
});

describe("buildQAPChartData", () => {
  it("converts QAP to TiB", () => {
    const tib = String(BigInt(1024) ** BigInt(4));
    const buckets: SectorBuckets = {
      All: [
        {
          BucketEpoch: 1000,
          Count: 10,
          QAP: tib,
          Days: 5,
          VestedLockedFunds: "0",
        },
      ],
      CC: [],
    };
    const result = buildQAPChartData(buckets);
    expect(result).toHaveLength(1);
    expect(result[0]?.all).toBe(1);
  });

  it("preserves fractional TiB when converting QAP", () => {
    const oneAndHalfTiB = String((1024n ** 4n * 3n) / 2n);
    const buckets: SectorBuckets = {
      All: [
        {
          BucketEpoch: 1000,
          Count: 10,
          QAP: oneAndHalfTiB,
          Days: 5,
          VestedLockedFunds: "0",
        },
      ],
      CC: [],
    };

    const result = buildQAPChartData(buckets);

    expect(result).toHaveLength(1);
    expect(result[0]?.all).toBe(1.5);
  });
});

describe("buildVestedFundsChartData", () => {
  it("converts attoFIL to FIL", () => {
    const oneFIL = String(BigInt(10) ** BigInt(18));
    const buckets: SectorBuckets = {
      All: [
        {
          BucketEpoch: 1000,
          Count: 10,
          QAP: "0",
          Days: 5,
          VestedLockedFunds: oneFIL,
        },
      ],
      CC: [],
    };
    const result = buildVestedFundsChartData(buckets);
    expect(result).toHaveLength(1);
    expect(result[0]?.value).toBeCloseTo(1, 2);
  });
});
