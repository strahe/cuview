import { formatDistanceToNow, format, isValid } from "date-fns";

export const formatBytes = (bytes: number | undefined | null): string => {
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  if (!bytes || bytes === 0) return "0 B";
  if (isNaN(bytes)) return "0 B";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizeIndex = Math.min(i, sizes.length - 1);
  const formattedValue =
    Math.round((bytes / Math.pow(1024, sizeIndex)) * 100) / 100;

  return `${formattedValue} ${sizes[sizeIndex]}`;
};

export const formatDuration = (posted: string): string => {
  if (!posted) return "0m";

  let postedDate: Date;

  // Handle Unix timestamp (if it's a number string)
  if (/^\d+$/.test(posted)) {
    postedDate = new Date(parseInt(posted) * 1000);
  } else {
    postedDate = new Date(posted);
  }

  // Validate date
  if (!isValid(postedDate)) {
    return "0m";
  }

  return formatDistanceToNow(postedDate);
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);

  if (!isValid(date)) {
    return "Unknown";
  }

  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Use relative time for recent dates (within a week)
  if (Math.abs(diffDays) < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  // Use absolute date for older dates
  const currentYear = now.getFullYear();
  const dateYear = date.getFullYear();

  if (dateYear === currentYear) {
    return format(date, "MMM d");
  } else {
    return format(date, "MMM d, yyyy");
  }
};

export const formatPercentage = (
  value: number,
  decimals: number = 1,
): string => {
  if (isNaN(value)) return "0%";
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (num: number | undefined | null): string => {
  if (!num || num === 0) return "0";
  if (isNaN(num)) return "0";

  const suffixes = ["", "K", "M", "B", "T"];
  const tier = (Math.log10(Math.abs(num)) / 3) | 0;

  if (tier === 0) return num.toString();

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;

  return scaled.toFixed(1).replace(/\.0$/, "") + suffix;
};
