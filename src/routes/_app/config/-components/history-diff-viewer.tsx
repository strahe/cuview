import { useMemo } from "react";
import type { DiffLine } from "../-module/types";

// ---------------------------------------------------------------------------
// LCS-based line diff (matches Curio built-in UI approach)
// ---------------------------------------------------------------------------

function computeLcsDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    const row = dp[i]!;
    const prevRow = dp[i - 1]!;
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        row[j] = prevRow[j - 1]! + 1;
      } else {
        row[j] = Math.max(prevRow[j]!, row[j - 1]!);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({ kind: "context", text: oldLines[i - 1] ?? "" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      result.push({ kind: "added", text: newLines[j - 1] ?? "" });
      j--;
    } else {
      result.push({ kind: "removed", text: oldLines[i - 1] ?? "" });
      i--;
    }
  }

  return result.reverse();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HistoryDiffViewerProps {
  oldContent: string;
  newContent: string;
  oldLabel?: string;
  newLabel?: string;
}

export function HistoryDiffViewer({
  oldContent,
  newContent,
  oldLabel,
  newLabel,
}: HistoryDiffViewerProps) {
  const diffLines = useMemo(() => {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");
    return computeLcsDiff(oldLines, newLines);
  }, [oldContent, newContent]);

  if (diffLines.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No differences.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {(oldLabel || newLabel) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {oldLabel && <span>{oldLabel}</span>}
          {oldLabel && newLabel && <span>→</span>}
          {newLabel && <span>{newLabel}</span>}
        </div>
      )}
      <div className="max-h-[70vh] overflow-auto rounded-md border border-border bg-muted/30">
        <pre className="p-3 text-xs leading-5">
          {diffLines.map((line, idx) => {
            let prefix: string;
            let className: string;

            switch (line.kind) {
              case "added":
                prefix = "+ ";
                className = "bg-success/10 text-success";
                break;
              case "removed":
                prefix = "- ";
                className = "bg-destructive/10 text-destructive";
                break;
              default:
                prefix = "  ";
                className = "text-muted-foreground";
                break;
            }

            return (
              <div key={`diff-${idx}`} className={className}>
                {prefix}
                {line.text}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}
