import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfigHistory, useConfigHistoryEntry } from "../-module/queries";
import type { ConfigHistoryEntryView } from "../-module/types";
import { HistoryDiffViewer } from "./history-diff-viewer";

interface HistoryDialogProps {
  layer: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore?: (content: string) => void;
}

export function HistoryDialog({
  layer,
  open,
  onOpenChange,
  onRestore,
}: HistoryDialogProps) {
  const { data: entries, isLoading } = useConfigHistory(open ? layer : null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const previousLayer = useRef(layer);

  useEffect(() => {
    if (!open && expandedId !== null) {
      setExpandedId(null);
    }
  }, [expandedId, open]);

  useEffect(() => {
    if (previousLayer.current !== layer) {
      previousLayer.current = layer;
      setExpandedId(null);
    }
  }, [layer]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>History: {layer}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={`hist-skel-${i}`} className="h-16" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No history entries.
            </p>
          ) : (
            entries.map((entry) => (
              <HistoryEntryItem
                key={entry.id}
                entry={entry}
                layer={layer}
                expanded={expandedId === entry.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === entry.id ? null : entry.id))
                }
                onRestore={onRestore}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Single history entry with expandable diff
// ---------------------------------------------------------------------------

function HistoryEntryItem({
  entry,
  layer,
  expanded,
  onToggle,
  onRestore,
}: {
  entry: ConfigHistoryEntryView;
  layer: string;
  expanded: boolean;
  onToggle: () => void;
  onRestore?: (content: string) => void;
}) {
  const { data: entryDetail, isLoading: detailLoading } = useConfigHistoryEntry(
    expanded ? layer : null,
    expanded ? entry.id : null,
  );

  return (
    <div className="rounded-md border border-border">
      <Button
        type="button"
        className="h-auto w-full justify-between px-3 py-2.5 text-left text-sm font-normal"
        onClick={onToggle}
        variant="ghost"
      >
        <span className="font-medium">Version #{entry.id}</span>
        <span className="text-xs text-muted-foreground">{entry.createdAt}</span>
      </Button>

      {expanded && (
        <div className="border-t border-border px-3 py-3">
          {detailLoading ? (
            <Skeleton className="h-32" />
          ) : entryDetail ? (
            <div className="space-y-3">
              <HistoryDiffViewer
                oldContent={entryDetail.old_config ?? ""}
                newContent={entryDetail.new_config ?? ""}
                oldLabel={`Version #${entry.id} (Before change)`}
                newLabel={`Version #${entry.id} (After change)`}
              />
              {onRestore && entry.content && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRestore(entry.content)}
                  >
                    Restore this version
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <pre className="max-h-48 overflow-auto rounded bg-muted/30 p-3 text-xs">
                {entry.content?.slice(0, 1000)}
                {(entry.content?.length ?? 0) > 1000 ? "…" : ""}
              </pre>
              {onRestore && entry.content && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRestore(entry.content)}
                  >
                    Restore this version
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
