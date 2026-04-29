import path from "node:path";

const RAW_HTML_TAG_PATTERN = /<(label|button|input|select|textarea)(?=[\s>])/g;
const RAW_TABLE_TAG_PATTERN = /<(table|thead|tbody|tr|th|td)(?=[\s>])/g;
const DIRECT_UI_LABEL_IMPORT_PATTERN =
  /from\s+["']@\/components\/ui\/label["']/g;
const DIRECT_UI_FIELD_IMPORT_PATTERN =
  /from\s+["']@\/components\/ui\/field["']/g;
const HARDCODED_PALETTE_PATTERN =
  /\b(?:text|bg|border)-(?:emerald|amber|green|red|yellow|orange|rose|purple|blue|slate|zinc|gray)(?:-[A-Za-z0-9]+)?(?:\/[0-9]+)?/g;
const SELECT_CONTENT_BLOCK_PATTERN =
  /<SelectContent\b[^>]*>[\s\S]*?<\/SelectContent>/g;
const SELECT_ITEM_PATTERN = /<SelectItem\b/;
const SELECT_GROUP_PATTERN = /<SelectGroup\b/;
const SPACE_UTILITY_PATTERN = /\bspace-[xy]-[^\s"'`}>]+/g;
const UI_BASELINE_ROOT = "src/components/ui/";
const COMPOSED_FORM_ROOT = "src/components/composed/form/";
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

export function findUiStyleViolations(files, options = {}) {
  const enforceSpacing = options.enforceSpacing === true;
  const violations = [];

  for (const file of files) {
    if (isUiHtmlGuardIgnoredPath(file.path)) {
      continue;
    }

    collectPatternViolations(
      violations,
      file,
      RAW_TABLE_TAG_PATTERN,
      (match) => ({
        kind: "raw-table",
        tag: match[1],
      }),
    );

    collectPatternViolations(
      violations,
      file,
      DIRECT_UI_LABEL_IMPORT_PATTERN,
      () => ({ kind: "direct-ui-label-import" }),
    );

    if (!isComposedFormPath(file.path)) {
      collectPatternViolations(
        violations,
        file,
        DIRECT_UI_FIELD_IMPORT_PATTERN,
        () => ({ kind: "direct-ui-field-import" }),
      );
    }

    collectSelectGroupViolations(violations, file);

    collectPatternViolations(
      violations,
      file,
      HARDCODED_PALETTE_PATTERN,
      (match) => ({
        kind: "hardcoded-palette",
        token: match[0],
      }),
    );

    if (enforceSpacing) {
      collectPatternViolations(
        violations,
        file,
        SPACE_UTILITY_PATTERN,
        (match) => ({
          kind: "spacing-utility",
          token: match[0],
        }),
      );
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

export function formatUiStyleViolation(violation) {
  switch (violation.kind) {
    case "raw-table":
      return `${violation.path}:${violation.line} uses raw <${violation.tag}> table markup`;
    case "direct-ui-label-import":
      return `${violation.path}:${violation.line} imports ui/label directly in business code`;
    case "direct-ui-field-import":
      return `${violation.path}:${violation.line} imports ui/field directly outside the composed form entrypoint`;
    case "missing-select-group":
      return `${violation.path}:${violation.line} uses SelectItem in SelectContent without SelectGroup`;
    case "hardcoded-palette":
      return `${violation.path}:${violation.line} uses hardcoded palette token ${violation.token}`;
    case "spacing-utility":
      return `${violation.path}:${violation.line} uses ${violation.token}; prefer flex/grid gap`;
    default:
      return `${violation.path}:${violation.line} has unsupported UI style usage`;
  }
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

function collectPatternViolations(violations, file, pattern, createViolation) {
  for (const match of file.content.matchAll(pattern)) {
    violations.push({
      line: getLineNumber(file.content, match.index ?? 0),
      path: normalizePath(file.path),
      ...createViolation(match),
    });
  }
}

function collectSelectGroupViolations(violations, file) {
  for (const match of file.content.matchAll(SELECT_CONTENT_BLOCK_PATTERN)) {
    const block = match[0];
    if (!SELECT_ITEM_PATTERN.test(block) || SELECT_GROUP_PATTERN.test(block)) {
      continue;
    }

    violations.push({
      kind: "missing-select-group",
      line: getLineNumber(file.content, match.index ?? 0),
      path: normalizePath(file.path),
    });
  }
}

function isComposedFormPath(filePath) {
  return normalizePath(filePath).startsWith(COMPOSED_FORM_ROOT);
}

function getLineNumber(content, matchIndex) {
  return content.slice(0, matchIndex).split("\n").length;
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}
