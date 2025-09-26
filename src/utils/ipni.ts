import type { IpniSyncStatus } from "@/types/ipni";

export const hasSyncError = (status: IpniSyncStatus): boolean => {
  return Boolean(status.error && status.error.trim().length > 0);
};

export const isSyncBehind = (status: IpniSyncStatus): boolean => {
  if (!status.remote_ad) return false;
  return status.remote_ad.toLowerCase().includes("behind");
};

export const getSyncStatusBadge = (status: IpniSyncStatus): string => {
  if (hasSyncError(status)) return "badge-error";
  if (isSyncBehind(status)) return "badge-warning";
  return "badge-success";
};

export const getSyncStatusLabel = (status: IpniSyncStatus): string => {
  if (hasSyncError(status)) return "Error";
  if (isSyncBehind(status)) return "Behind";
  return "Synced";
};

export const getServiceHost = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.host || url;
  } catch {
    return url;
  }
};
