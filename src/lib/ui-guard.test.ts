import { describe, expect, it } from "vitest";
import {
  findRawHtmlViolations,
  findUiBaselineViolations,
  isUiHtmlGuardIgnoredPath,
  mergeNameStatusEntries,
} from "../../scripts/ui-guard.mjs";

describe("ui html guard", () => {
  it("ignores generated, tests, and ui baseline files", () => {
    expect(isUiHtmlGuardIgnoredPath("src/components/ui/button.tsx")).toBe(true);
    expect(isUiHtmlGuardIgnoredPath("src/routes/foo.test.tsx")).toBe(true);
    expect(
      isUiHtmlGuardIgnoredPath("src/routes/foo.integration.test.tsx"),
    ).toBe(true);
    expect(isUiHtmlGuardIgnoredPath("src/routes/foo.unit.test.tsx")).toBe(true);
    expect(isUiHtmlGuardIgnoredPath("src/routeTree.gen.ts")).toBe(true);
    expect(isUiHtmlGuardIgnoredPath("src/routes/setup.tsx")).toBe(false);
  });

  it("reports raw html interactive and form elements in business files", () => {
    const violations = findRawHtmlViolations([
      {
        path: "src/routes/setup.tsx",
        content: `
          <div>
            <label htmlFor="endpoint">Endpoint</label>
            <input id="endpoint" />
            <button type="button">Save</button>
          </div>
        `,
      },
    ]);

    expect(violations).toEqual([
      {
        line: 3,
        path: "src/routes/setup.tsx",
        tag: "label",
      },
      {
        line: 4,
        path: "src/routes/setup.tsx",
        tag: "input",
      },
      {
        line: 5,
        path: "src/routes/setup.tsx",
        tag: "button",
      },
    ]);
  });

  it("does not report ignored files", () => {
    const violations = findRawHtmlViolations([
      {
        path: "src/components/ui/input.tsx",
        content: "<input />",
      },
      {
        path: "src/routes/setup.test.tsx",
        content: "<button />",
      },
    ]);

    expect(violations).toEqual([]);
  });
});

describe("ui baseline guard", () => {
  it("merges committed and uncommitted name-status entries before checking violations", () => {
    const violations = findUiBaselineViolations(
      mergeNameStatusEntries(
        ["M\tsrc/routes/setup.tsx"],
        ["M\tsrc/components/ui/button.tsx"],
        ["M\tsrc/components/ui/button.tsx"],
      ),
    );

    expect(violations).toEqual([
      {
        entry: "M\tsrc/components/ui/button.tsx",
        path: "src/components/ui/button.tsx",
        status: "M",
      },
    ]);
  });

  it("allows added and deleted ui files", () => {
    const violations = findUiBaselineViolations([
      "A\tsrc/components/ui/field.tsx",
      "D\tsrc/components/ui/old-field.tsx",
    ]);

    expect(violations).toEqual([]);
  });

  it("rejects modified and renamed existing ui files", () => {
    const violations = findUiBaselineViolations([
      "M\tsrc/components/ui/button.tsx",
      "R100\tsrc/components/ui/label.tsx\tsrc/components/ui/label-next.tsx",
      "M\tsrc/routes/setup.tsx",
    ]);

    expect(violations).toEqual([
      {
        entry: "M\tsrc/components/ui/button.tsx",
        path: "src/components/ui/button.tsx",
        status: "M",
      },
      {
        entry:
          "R100\tsrc/components/ui/label.tsx\tsrc/components/ui/label-next.tsx",
        path: "src/components/ui/label-next.tsx",
        status: "R100",
      },
    ]);
  });
});
