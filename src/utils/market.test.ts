import { describe, expect, it } from "vitest";
import {
  attoFilToFilPerTiBPerMonth,
  filToAttoFilPerGiBPerEpoch,
} from "./market";

describe("market price conversions", () => {
  it("formats tiny non-zero attoFIL values as the shortest non-zero decimal that round-trips", () => {
    expect(attoFilToFilPerTiBPerMonth(11)).toBe("0.000000001");
  });

  it("round-trips tiny FIL/TiB/Month values back to the original attoFIL integer", () => {
    const displayValue = attoFilToFilPerTiBPerMonth(11);

    expect(filToAttoFilPerGiBPerEpoch(displayValue)).toBe(11);
  });

  it("prefers short human-readable decimals when they map back to the same attoFIL value", () => {
    const attoValue = filToAttoFilPerGiBPerEpoch("0.1");

    expect(attoValue).not.toBeNull();
    expect(attoFilToFilPerTiBPerMonth(attoValue ?? 0)).toBe("0.1");
  });
});
