declare module "../../scripts/ui-guard.mjs" {
  export interface RawHtmlViolation {
    line: number;
    path: string;
    tag: string;
  }

  export interface UiBaselineViolation {
    entry: string;
    path: string;
    status: string;
  }

  export type UiStyleViolation =
    | {
        kind: "raw-table";
        line: number;
        path: string;
        tag: string;
      }
    | {
        kind:
          | "direct-ui-label-import"
          | "direct-ui-field-import"
          | "missing-select-group";
        line: number;
        path: string;
      }
    | {
        kind: "hardcoded-palette" | "spacing-utility";
        line: number;
        path: string;
        token: string;
      };

  export function isUiHtmlGuardIgnoredPath(filePath: string): boolean;
  export function findRawHtmlViolations(
    files: Array<{ content: string; path: string }>,
  ): RawHtmlViolation[];
  export function findUiStyleViolations(
    files: Array<{ content: string; path: string }>,
    options?: { enforceSpacing?: boolean },
  ): UiStyleViolation[];
  export function findUiBaselineViolations(
    diffEntries: string[],
  ): UiBaselineViolation[];
  export function mergeNameStatusEntries(...entryGroups: string[][]): string[];
  export function formatRawHtmlViolation(violation: RawHtmlViolation): string;
  export function formatUiStyleViolation(violation: UiStyleViolation): string;
  export function formatUiBaselineViolation(
    violation: UiBaselineViolation,
  ): string;
}
