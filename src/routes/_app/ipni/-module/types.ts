/** Aggregated statistics computed from IPNISummary response. */
export interface IpniProviderStats {
  total: number;
  withHead: number;
  withErrors: number;
}

/** Status of a single entry during chain scanning. */
export type EntryScanStatus = "unscanned" | "scanned" | "error" | "scanning";

/** A single cell in the entry-scan grid. */
export interface EntryScanEntry {
  status: EntryScanStatus;
  cid: string | null;
  details: ScanEntryDetail | null;
}

/** Subset of IPNIEntry response used by the scan grid. */
export interface ScanEntryDetail {
  PieceCID: string;
  FromCar: boolean;
  NumBlocks: number;
  Size: number;
  PrevCID: string | null;
  Err?: string | null;
}
