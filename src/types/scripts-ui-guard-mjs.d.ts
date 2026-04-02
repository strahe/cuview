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

  export function isUiHtmlGuardIgnoredPath(filePath: string): boolean;
  export function findRawHtmlViolations(
    files: Array<{ content: string; path: string }>,
  ): RawHtmlViolation[];
  export function findUiBaselineViolations(
    diffEntries: string[],
  ): UiBaselineViolation[];
  export function mergeNameStatusEntries(...entryGroups: string[][]): string[];
  export function formatRawHtmlViolation(violation: RawHtmlViolation): string;
  export function formatUiBaselineViolation(
    violation: UiBaselineViolation,
  ): string;
}
