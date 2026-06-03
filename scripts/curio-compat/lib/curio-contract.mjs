import { execFileSync } from "node:child_process";
import path from "node:path";
import { refSha } from "./git.mjs";

export function loadCurioContract({
  curioRepo,
  ref,
  repoRoot = process.cwd(),
}) {
  const helper = path.join(repoRoot, "scripts/curio-compat/goast/main.go");
  const output = execFileSync(
    "go",
    ["run", helper, "--repo", curioRepo, "--ref", ref],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  return {
    ...JSON.parse(output),
    ref,
    sha: refSha(curioRepo, ref),
  };
}
