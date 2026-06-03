import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export function collectSourceFiles(repoRoot) {
  const output = execFileSync("git", ["ls-files", "src"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return output
    .split(/\r?\n/)
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .map((file) => ({
      content: readFileSync(path.join(repoRoot, file), "utf8"),
      path: file,
    }));
}
