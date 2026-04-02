import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurioApi } from "@/contexts/curio-api-context";
import type { IpniEntryInfo } from "@/types/ipni";
import type { EntryScanEntry, ScanEntryDetail } from "../-module/types";

const GRID_COLUMN_COUNT = 64;
const MAX_SCAN_ENTRIES = 1000;

interface EntryScanGridProps {
  entriesHead: string;
  entryCount: number;
}

function resolvePrevCid(
  val: string | null | undefined | { "/": string },
): string | null {
  if (!val) return null;
  if (typeof val === "object" && "/" in val) return val["/"];
  return val;
}

function toScanDetail(info: IpniEntryInfo): ScanEntryDetail {
  return {
    PieceCID: info.PieceCID,
    FromCar: info.FromCar,
    NumBlocks: info.NumBlocks,
    Size: info.Size,
    PrevCID: resolvePrevCid(info.PrevCID),
    Err: info.Err,
  };
}

function getEntryAriaLabel(
  index: number,
  entry: EntryScanEntry,
  isScanning: boolean,
) {
  const prefix = `Entry ${index + 1}`;

  if (isScanning) {
    return `${prefix}, scanning`;
  }

  if (entry.status === "scanned") {
    return entry.cid
      ? `${prefix}, scanned, CID ${entry.cid}`
      : `${prefix}, scanned`;
  }

  if (entry.status === "error") {
    return entry.cid
      ? `${prefix}, error, CID ${entry.cid}`
      : `${prefix}, error`;
  }

  return `${prefix}, not scanned yet`;
}

export function EntryScanGrid({ entriesHead, entryCount }: EntryScanGridProps) {
  const api = useCurioApi();
  const [entries, setEntries] = useState<EntryScanEntry[]>([]);
  const [scanningIndex, setScanningIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentEntry, setCurrentEntry] = useState<ScanEntryDetail | null>(
    null,
  );
  const scanIdRef = useRef(0);
  const visibleEntryCount = Math.min(entryCount, MAX_SCAN_ENTRIES);
  const isCapped = entryCount > MAX_SCAN_ENTRIES;

  const startScanning = useCallback(async () => {
    if (!entriesHead || visibleEntryCount <= 0) return;

    const scanId = scanIdRef.current + 1;
    scanIdRef.current = scanId;
    const isStale = () => scanIdRef.current !== scanId;

    const initial: EntryScanEntry[] = Array.from(
      { length: visibleEntryCount },
      () => ({
        status: "unscanned" as const,
        cid: null,
        details: null,
      }),
    );
    setEntries(initial);
    setSelectedIndex(null);
    setCurrentEntry(null);

    let currentCid: string | null = entriesHead;
    let idx = 0;

    while (idx < visibleEntryCount && currentCid && !isStale()) {
      const scanIndex = idx;
      const scannedCid = currentCid;
      setScanningIndex(scanIndex);

      try {
        const result = await api.call<IpniEntryInfo>("IPNIEntry", [scannedCid]);
        if (isStale()) return;

        const detail = toScanDetail(result);

        setEntries((prev) => {
          const next = [...prev];
          next[scanIndex] = {
            status: detail.Err ? "error" : "scanned",
            cid: scannedCid,
            details: detail,
          };
          return next;
        });
        setCurrentEntry(detail);

        currentCid = detail.PrevCID;
      } catch (err) {
        if (isStale()) return;

        setEntries((prev) => {
          const next = [...prev];
          next[scanIndex] = {
            status: "error",
            cid: scannedCid,
            details: {
              PieceCID: "",
              FromCar: false,
              NumBlocks: 0,
              Size: 0,
              PrevCID: null,
              Err: err instanceof Error ? err.message : String(err),
            },
          };
          return next;
        });
        currentCid = null;
      }

      idx = scanIndex + 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (isStale()) return;
    }

    if (isStale()) return;
    setScanningIndex(null);
    setCurrentEntry(null);
  }, [api, entriesHead, visibleEntryCount]);

  useEffect(() => {
    void startScanning();
    return () => {
      scanIdRef.current += 1;
    };
  }, [startScanning]);

  const selectedEntry =
    selectedIndex !== null ? entries[selectedIndex]?.details : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entry Chain Scan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentEntry && (
          <div>
            <div className="mb-1 text-xs text-muted-foreground">
              Scanning entry {(scanningIndex ?? 0) + 1} of {visibleEntryCount}…
            </div>
            <pre className="max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(currentEntry, null, 2)}
            </pre>
          </div>
        )}

        {isCapped && (
          <p className="text-xs text-muted-foreground">
            Showing first {MAX_SCAN_ENTRIES.toLocaleString()} of{" "}
            {entryCount.toLocaleString()} entries to keep scanning responsive.
          </p>
        )}

        {selectedEntry && (
          <div>
            <div className="mb-1 text-xs text-muted-foreground">
              Selected: Entry {(selectedIndex ?? 0) + 1}
            </div>
            <pre className="max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(selectedEntry, null, 2)}
            </pre>
          </div>
        )}

        <div className="overflow-x-auto">
          <div
            className="grid min-w-fit gap-0.5"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLUMN_COUNT}, 10px)`,
            }}
          >
            {entries.map((entry, index) => {
              const isScanning = index === scanningIndex;
              const isSelected = index === selectedIndex;
              const isInteractive =
                entry.status === "scanned" || entry.status === "error";

              let bg = "bg-muted-foreground/30";
              if (isScanning) bg = "bg-primary animate-pulse";
              else if (entry.status === "scanned") bg = "bg-success";
              else if (entry.status === "error") bg = "bg-destructive";

              return (
                <Button
                  key={index}
                  type="button"
                  aria-label={getEntryAriaLabel(index, entry, isScanning)}
                  aria-pressed={isSelected}
                  disabled={!isInteractive}
                  className={`h-2.5 w-2.5 rounded-[1px] p-0 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${bg} ${
                    isSelected ? "ring-1 ring-primary ring-offset-1" : ""
                  } ${isInteractive ? "cursor-pointer" : "cursor-default"}`}
                  title={`Entry ${index + 1}${entry.cid ? ` — ${entry.cid.slice(0, 16)}…` : ""}`}
                  variant="ghost"
                  onClick={() => {
                    if (isInteractive) {
                      setSelectedIndex(index);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
