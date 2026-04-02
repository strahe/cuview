import path from "node:path";

const RAW_HTML_TAG_PATTERN = /<(label|button|input|select|textarea)(?=[\s>])/g;
const UI_BASELINE_ROOT = "src/components/ui/";
const TEST_FILE_PATTERN =
  /\.(test|integration\.test|unit\.test)\.(ts|tsx)$/;

export function isUiHtmlGuardIgnoredPath(filePath) {
  const normalizedPath = normalizePath(filePath);

  return (
    normalizedPath === "src/routeTree.gen.ts" ||
    normalizedPath.startsWith(UI_BASELINE_ROOT) ||
    TEST_FILE_PATTERN.test(normalizedPath)
  );
}

export function findRawHtmlViolations(files) {
  const violations = [];

  for (const file of files) {
    if (isUiHtmlGuardIgnoredPath(file.path)) {
      continue;
    }

    for (const match of file.content.matchAll(RAW_HTML_TAG_PATTERN)) {
      violations.push({
        line: getLineNumber(file.content, match.index ?? 0),
        path: normalizePath(file.path),
        tag: match[1],
      });
    }
  }

  return violations;
}

export function mergeNameStatusEntries(...entryGroups) {
  return [...new Set(entryGroups.flat().map((entry) => entry.trim()).filter(Boolean))];
}

export function findUiBaselineViolations(diffEntries) {
  return diffEntries
    .map((entry) => parseNameStatusEntry(entry))
    .filter(Boolean)
    .filter((entry) => entry.path.startsWith(UI_BASELINE_ROOT))
    .filter((entry) => !["A", "D"].includes(entry.status));
}

export function formatRawHtmlViolation(violation) {
  return `${violation.path}:${violation.line} uses raw <${violation.tag}>`;
}

export function formatUiBaselineViolation(violation) {
  return `${violation.status} ${violation.path} is not allowed in ${UI_BASELINE_ROOT}`;
}

function parseNameStatusEntry(entry) {
  const parts = entry.split("\t");
  const status = parts[0];

  if (!status || parts.length < 2) {
    return null;
  }

  if (status.startsWith("R")) {
    return {
      entry,
      path: normalizePath(parts[2] ?? parts[1]),
      status,
    };
  }

  return {
    entry,
    path: normalizePath(parts[1]),
    status,
  };
}

function getLineNumber(content, matchIndex) {
  return content.slice(0, matchIndex).split("\n").length;
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}
