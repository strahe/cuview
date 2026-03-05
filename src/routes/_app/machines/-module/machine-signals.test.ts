import { describe, expect, it } from "vitest";
import { getMachineSignals, parseDurationSeconds } from "./machine-signals";

describe("parseDurationSeconds", () => {
  it("parses millisecond and subsecond units correctly", () => {
    expect(parseDurationSeconds("500ms")).toBeCloseTo(0.5, 10);
    expect(parseDurationSeconds("250us")).toBeCloseTo(0.00025, 10);
    expect(parseDurationSeconds("250µs")).toBeCloseTo(0.00025, 10);
    expect(parseDurationSeconds("250μs")).toBeCloseTo(0.00025, 10);
    expect(parseDurationSeconds("10ns")).toBeCloseTo(0.00000001, 14);
  });

  it("keeps mixed duration parsing compatible", () => {
    expect(parseDurationSeconds("1m500ms")).toBeCloseTo(60.5, 10);
    expect(parseDurationSeconds("17m48.749863606s")).toBeCloseTo(
      1068.749863606,
      10,
    );
  });
});

describe("getMachineSignals", () => {
  it("does not mark fresh subsecond contact as offline", () => {
    expect(
      getMachineSignals({
        SinceContact: "500ms",
        Unschedulable: false,
        Restarting: false,
        RestartRequest: "",
      }).offline,
    ).toBe(false);
  });
});
