import { execFileSync } from "node:child_process";
import path from "node:path";

export function repoRelativeFromCwd(value, cwd) {
  return path.resolve(cwd, value);
}

export function assertGitRepo(repo) {
  execFileSync("git", ["rev-parse", "--git-dir"], {
    cwd: repo,
    stdio: "ignore",
  });
}

export function hasRef(repo, ref) {
  try {
    execFileSync("git", ["rev-parse", "--verify", "--quiet", ref], {
      cwd: repo,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export function fetchTags(repo) {
  execFileSync("git", ["fetch", "--tags"], { cwd: repo, stdio: "inherit" });
}

export function refSha(repo, ref) {
  return execFileSync("git", ["rev-parse", ref], {
    cwd: repo,
    encoding: "utf8",
  }).trim();
}
