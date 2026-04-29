import { describe, expect, it } from "vitest";
import {
  findRawHtmlViolations,
  findUiBaselineViolations,
  findUiStyleViolations,
  formatUiStyleViolation,
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

describe("ui style guard", () => {
  it("reports raw table markup in business files", () => {
    const violations = findUiStyleViolations([
      {
        path: "src/routes/foo.tsx",
        content: `
          <Table />
          <table>
            <tbody />
          </table>
        `,
      },
    ]);

    expect(violations).toEqual([
      {
        kind: "raw-table",
        line: 3,
        path: "src/routes/foo.tsx",
        tag: "table",
      },
      {
        kind: "raw-table",
        line: 4,
        path: "src/routes/foo.tsx",
        tag: "tbody",
      },
    ]);
  });

  it("reports direct route imports from ui label", () => {
    const violations = findUiStyleViolations([
      {
        path: "src/routes/foo.tsx",
        content: 'import { Label } from "@/components/ui/label";',
      },
    ]);

    expect(violations).toEqual([
      {
        kind: "direct-ui-label-import",
        line: 1,
        path: "src/routes/foo.tsx",
      },
    ]);
  });

  it("reports direct business imports from ui field", () => {
    const violations = findUiStyleViolations([
      {
        path: "src/routes/foo.tsx",
        content: 'import { Field } from "@/components/ui/field";',
      },
      {
        path: "src/components/composed/form/index.tsx",
        content: 'import { Field } from "@/components/ui/field";',
      },
    ]);

    expect(violations).toEqual([
      {
        kind: "direct-ui-field-import",
        line: 1,
        path: "src/routes/foo.tsx",
      },
    ]);
  });

  it("reports SelectContent blocks that skip SelectGroup", () => {
    const violations = findUiStyleViolations([
      {
        path: "src/routes/foo.tsx",
        content: `
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ok">OK</SelectItem>
            </SelectGroup>
          </SelectContent>
        `,
      },
    ]);

    expect(violations).toEqual([
      {
        kind: "missing-select-group",
        line: 2,
        path: "src/routes/foo.tsx",
      },
    ]);
  });

  it("reports hardcoded palette state colors", () => {
    const violations = findUiStyleViolations([
      {
        path: "src/routes/foo.tsx",
        content:
          '<span className="border-amber-500/30 bg-green-500/10 text-red-500" />',
      },
    ]);

    expect(violations).toEqual([
      {
        kind: "hardcoded-palette",
        line: 1,
        path: "src/routes/foo.tsx",
        token: "border-amber-500/30",
      },
      {
        kind: "hardcoded-palette",
        line: 1,
        path: "src/routes/foo.tsx",
        token: "bg-green-500/10",
      },
      {
        kind: "hardcoded-palette",
        line: 1,
        path: "src/routes/foo.tsx",
        token: "text-red-500",
      },
    ]);
  });

  it("keeps space utility checks opt-in until spacing cleanup is complete", () => {
    const files = [
      {
        path: "src/routes/foo.tsx",
        content: '<div className="space-y-4" />',
      },
    ];

    expect(findUiStyleViolations(files)).toEqual([]);
    expect(findUiStyleViolations(files, { enforceSpacing: true })).toEqual([
      {
        kind: "spacing-utility",
        line: 1,
        path: "src/routes/foo.tsx",
        token: "space-y-4",
      },
    ]);
  });

  it("formats style violations for guard output", () => {
    expect(
      formatUiStyleViolation({
        kind: "hardcoded-palette",
        line: 2,
        path: "src/routes/foo.tsx",
        token: "text-red-500",
      }),
    ).toBe("src/routes/foo.tsx:2 uses hardcoded palette token text-red-500");
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
