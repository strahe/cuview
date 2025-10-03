import { formatBytes as formatSize } from "@/utils/format";

// Filecoin epochs are ~30 seconds, so 30 days ~= 86,400 epochs.
const EPOCHS_IN_MONTH = 86400;
// Binary unit conversion helpers.
const GIB_IN_TIB = 1024;
const ATTOFIL_PER_FIL = 1e18;
// Piece sizes supported by the Curio market UI.
export const MAX_PIECE_SIZE_BYTES = 64 * 1024 ** 3;
export const MIN_PIECE_SIZE_BYTES = 128;
export const DEFAULT_PIECE_SIZE_BYTES = 32 * 1024 ** 3;

export function attoFilToFilPerTiBPerMonth(
  attoFilPerGiBPerEpoch: number,
): string {
  const filPerTiBPerMonth =
    (attoFilPerGiBPerEpoch * GIB_IN_TIB * EPOCHS_IN_MONTH) / ATTOFIL_PER_FIL;
  return filPerTiBPerMonth.toFixed(8);
}

export function filToAttoFilPerGiBPerEpoch(filPerTiBPerMonth: number): number {
  const attoFilPerGiBPerEpoch =
    (filPerTiBPerMonth * ATTOFIL_PER_FIL) / GIB_IN_TIB / EPOCHS_IN_MONTH;
  return Math.round(attoFilPerGiBPerEpoch);
}

const formatBytesDetailed = (bytes: number): string => {
  const friendly = formatSize(bytes);
  return `${friendly} (${bytes} bytes)`;
};

export function generateSizeOptions(): Array<{ value: number; label: string }> {
  const sizes = [];
  let sizeInBytes = MAX_PIECE_SIZE_BYTES;
  const minSizeInBytes = MIN_PIECE_SIZE_BYTES;

  // Mirror the Curio presets: start at 64 GiB and halve until the protocol minimum.
  while (sizeInBytes >= minSizeInBytes) {
    sizes.push({
      value: sizeInBytes,
      label: formatBytesDetailed(sizeInBytes),
    });
    sizeInBytes = sizeInBytes / 2;
  }
  return sizes;
}

export function getDealStatus(deal: {
  complete: boolean;
  indexed: boolean;
  announce: boolean;
  sector: number | null;
  after_find_deal: boolean;
  after_psd: boolean;
  after_commp: boolean;
  started: boolean;
}): string {
  if (deal.complete) {
    return "(#########) Complete";
  } else if (deal.indexed && deal.announce && !deal.complete) {
    return "(########.) Announcing";
  } else if (deal.indexed) {
    return "(#######..) Indexed";
  } else if (deal.sector != null) {
    return "(######...) Sealing And Indexing";
  } else if (deal.after_find_deal && deal.sector == null) {
    return "(#####....) Assigning Sector";
  } else if (deal.after_psd) {
    return "(####.....) Waiting for DealID";
  } else if (deal.after_commp) {
    return "(###......) Publishing Chain Deal";
  } else if (deal.started) {
    return "(##.......) Checking Data";
  } else {
    return "(#........) Downloading";
  }
}

export function getProgressFromStatus(status: string): number {
  const filled = (status.match(/#/g) || []).length;
  return (filled / 9) * 100;
}

export function getTaskTypeName(type: string): string {
  const names: Record<string, string> = {
    downloading: "Downloading",
    commp: "CommP Verification",
    psd: "PSD Publication",
    find_deal: "Sector Assignment",
    index: "Indexing",
  };
  return names[type] || type;
}
