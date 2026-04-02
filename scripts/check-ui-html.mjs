import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  findRawHtmlViolations,
  formatRawHtmlViolation,
} from "./ui-guard.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(repoRoot, "src");

const files = collectSourceFiles(srcRoot).map((filePath) => ({
  content: fs.readFileSync(filePath, "utf8"),
  path: path.relative(repoRoot, filePath),
}));

const violations = findRawHtmlViolations(files);

if (violations.length > 0) {
  console.error("Raw HTML UI usage is not allowed outside the UI baseline:");
  for (const violation of violations) {
    console.error(`- ${formatRawHtmlViolation(violation)}`);
  }
  process.exit(1);
}

function collectSourceFiles(rootDirectory) {
  const entries = fs.readdirSync(rootDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(rootDirectory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) {
      continue;
    }

    files.push(entryPath);
  }

  return files;
}
