import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  findUiBaselineViolations,
  formatUiBaselineViolation,
  mergeNameStatusEntries,
} from "./ui-guard.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const baseRef = process.env.UI_BASELINE_BASE_REF?.trim();
const mergeBase = resolveMergeBase(baseRef);
const committedDiffEntries = execGit(["diff", "--name-status", `${mergeBase}...HEAD`]).split("\n");
const stagedDiffEntries = execGit(["diff", "--name-status", "--cached"]).split("\n");
const workingTreeDiffEntries = execGit(["diff", "--name-status"]).split("\n");
const diffEntries = mergeNameStatusEntries(
  committedDiffEntries,
  stagedDiffEntries,
  workingTreeDiffEntries,
);
const violations = findUiBaselineViolations(diffEntries);

if (violations.length > 0) {
  console.error(
    "Modifying existing src/components/ui/* files is not allowed. Use shadcn CLI to add or delete UI baseline files.",
  );
  for (const violation of violations) {
    console.error(`- ${formatUiBaselineViolation(violation)}`);
  }
  process.exit(1);
}

function resolveMergeBase(base) {
  for (const candidate of getMergeBaseCandidates(base)) {
    const mergeBase = tryExecGit(["merge-base", candidate, "HEAD"]);
    if (mergeBase) {
      return mergeBase.trim();
    }
  }

  throw new Error(
    [
      "Unable to resolve a merge base for the UI baseline guard.",
      "Provide UI_BASELINE_BASE_REF explicitly or fetch the repository's base branch before running check:ui-baseline.",
    ].join(" "),
  );
}

function getMergeBaseCandidates(base) {
  const remoteHeadRef = resolveRemoteHeadRef();
  return [...new Set([base, remoteHeadRef, "origin/main", "origin/master", "main", "master"].filter(Boolean))];
}

function resolveRemoteHeadRef() {
  const symbolicRef = tryExecGit(["symbolic-ref", "refs/remotes/origin/HEAD"]);
  if (!symbolicRef) {
    return null;
  }

  return symbolicRef.trim().replace(/^refs\/remotes\//, "");
}

function execGit(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function tryExecGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}
