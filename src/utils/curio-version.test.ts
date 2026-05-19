import { describe, expect, it } from "vitest";
import {
  getCurioVersionSummary,
  isCurioVersionAtLeast,
  normalizeCurioVersion,
} from "./curio-version";

describe("curio version helpers", () => {
  it("normalizes version labels for display", () => {
    expect(normalizeCurioVersion("1.27.4+calibnet")).toBe("v1.27.4+calibnet");
    expect(getCurioVersionSummary("v1.27.4+calibnet")).toBe("v1.27.4");
  });

  it("compares release versions with metadata", () => {
    expect(isCurioVersionAtLeast("v1.27.4+calibnet", "1.27.4")).toBe(true);
    expect(isCurioVersionAtLeast("v1.28.0", "1.27.4")).toBe(true);
    expect(isCurioVersionAtLeast("v1.27.3", "1.27.4")).toBe(false);
    expect(isCurioVersionAtLeast(undefined, "1.27.4")).toBe(false);
  });
});
