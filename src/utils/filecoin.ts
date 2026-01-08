export const FILECOIN_EPOCH_DURATION_SECONDS = 30;
export const SECONDS_PER_DAY = 86400;
export const FILECOIN_EPOCHS_PER_DAY =
  SECONDS_PER_DAY / FILECOIN_EPOCH_DURATION_SECONDS;

export const epochToDays = (
  targetEpoch: number,
  referenceEpoch: number,
): number => {
  const epochDelta = targetEpoch - referenceEpoch;
  const seconds = epochDelta * FILECOIN_EPOCH_DURATION_SECONDS;
  return Math.max(0, Math.round(seconds / SECONDS_PER_DAY));
};

export const daysToEpochs = (days: number): number => {
  return Math.round(days * FILECOIN_EPOCHS_PER_DAY);
};

export const formatEpochRelative = (
  targetEpoch: number,
  currentEpoch: number,
): string => {
  if (!targetEpoch) return "N/A";
  if (!currentEpoch) return `Epoch ${targetEpoch}`;

  const epochDiff = targetEpoch - currentEpoch;
  const secondsDiff = epochDiff * FILECOIN_EPOCH_DURATION_SECONDS;
  const daysDiff = Math.round(secondsDiff / SECONDS_PER_DAY);

  if (daysDiff < 0) {
    const daysAgo = Math.abs(daysDiff);
    return `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;
  }

  if (daysDiff === 0) return "Today";
  if (daysDiff === 1) return "Tomorrow";

  return `in ${daysDiff} day${daysDiff === 1 ? "" : "s"}`;
};

/**
 * Format an attoFIL or raw FIL string to a human-readable representation.
 * Handles both numeric strings and already-formatted values.
 */
export const formatFilecoin = (value: string | number | undefined): string => {
  if (value === undefined || value === null || value === "") return "—";
  const str = String(value);

  // If already has "FIL" suffix, return as-is
  if (str.includes("FIL")) return str;

  // Try to parse as a number
  const num = Number(str);
  if (isNaN(num)) return str;

  // If the number is very large, assume attoFIL (1 FIL = 1e18 attoFIL)
  if (num > 1e15) {
    const fil = num / 1e18;
    return `${fil.toFixed(4)} FIL`;
  }

  return `${num.toFixed(4)} FIL`;
};
