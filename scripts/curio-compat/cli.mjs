#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareTargetGate, diffAddedInterfaces } from "./lib/compare.mjs";
import {
  collectCoverageIssues,
  collectCurioSourceUsageFromFiles,
} from "./lib/coverage.mjs";
import { loadCurioContract } from "./lib/curio-contract.mjs";
import { collectSourceFiles } from "./lib/files.mjs";
import {
  assertGitRepo,
  fetchTags,
  hasRef,
  repoRelativeFromCwd,
} from "./lib/git.mjs";
import { loadInventory } from "./lib/inventory.mjs";
import { CurioCompatUsageError, parseArgs } from "./lib/options.mjs";
import { writeArtifacts } from "./lib/report.mjs";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, "../..");

try {
  await main();
} catch (error) {
  if (error instanceof CurioCompatUsageError) {
    console.error(error.message);
    process.exit(2);
  }
  console.error(error instanceof Error ? error.message : String(error));
  const stderr = commandStderr(error);
  if (stderr) console.error(stderr);
  process.exit(2);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const curioRepo = repoRelativeFromCwd(options.curioRepo, process.cwd());

  assertCommandAvailable("go");
  assertGitRepo(curioRepo);
  ensureRefs(curioRepo, [options.from, options.to], options.fetch);

  const outputDir = options.outDir
    ? normalizeOutputDir(options.outDir, process.cwd(), curioRepo)
    : path.join(repoRoot, ".cache/curio-compat", safePathSegment(options.to));

  const inventory = loadInventory(path.join(dirname, "cuview-contract.json"));
  const usage = collectCurioSourceUsageFromFiles(collectSourceFiles(repoRoot));
  const coverageIssues = collectCoverageIssues(inventory, usage);
  if (coverageIssues.length > 0) {
    throw new CurioCompatUsageError(formatCoverageIssues(coverageIssues));
  }

  const fromCurio = loadCurioContract({
    curioRepo,
    ref: options.from,
    repoRoot,
  });
  const toCurio = loadCurioContract({ curioRepo, ref: options.to, repoRoot });
  const comparison = compareTargetGate({ inventory, target: toCurio });
  const addedInterfaces = diffAddedInterfaces({ from: fromCurio, to: toCurio });
  const reportPath = writeArtifacts({
    addedInterfaces,
    comparison,
    fromCurio,
    inventory,
    outputDir,
    toCurio,
  });

  console.log(`Curio compatibility report written to ${reportPath}`);
  process.exitCode = comparison.exitCode;
}

function ensureRefs(curioRepo, refs, fetch) {
  const missing = refs.filter((ref) => !hasRef(curioRepo, ref));
  if (missing.length === 0) return;
  if (fetch) {
    fetchTags(curioRepo);
    const stillMissing = refs.filter((ref) => !hasRef(curioRepo, ref));
    if (stillMissing.length === 0) return;
    throw new CurioCompatUsageError(
      `Missing Curio ref(s) after fetch: ${stillMissing.join(", ")}`,
    );
  }
  throw new CurioCompatUsageError(
    `Missing Curio ref(s): ${missing.join(", ")}. Re-run with --fetch to fetch tags.`,
  );
}

function assertCommandAvailable(command) {
  try {
    execFileSync(command, ["version"], { stdio: "ignore" });
  } catch {
    throw new CurioCompatUsageError(
      `Required command is not available on PATH: ${command}`,
    );
  }
}

function normalizeOutputDir(value, cwd, curioRepo) {
  const outputDir = path.resolve(cwd, value);
  const relativeToCurio = path.relative(curioRepo, outputDir);
  if (!relativeToCurio.startsWith("..") && !path.isAbsolute(relativeToCurio)) {
    throw new CurioCompatUsageError(
      "--out must not point inside the Curio reference repository",
    );
  }
  return outputDir;
}

function safePathSegment(value) {
  return value.replace(/[^A-Za-z0-9._-]/g, "_");
}

function formatCoverageIssues(issues) {
  const lines = ["Cuview inventory does not cover current source usage:"];
  for (const issue of issues.slice(0, 50)) {
    lines.push(`- ${JSON.stringify(issue)}`);
  }
  if (issues.length > 50) {
    lines.push(`- ... ${issues.length - 50} more`);
  }
  return lines.join("\n");
}

function commandStderr(error) {
  if (!error || typeof error !== "object" || !("stderr" in error)) return "";
  const stderr = error.stderr;
  if (typeof stderr === "string") return stderr.trim();
  if (Buffer.isBuffer(stderr)) return stderr.toString("utf8").trim();
  return "";
}
