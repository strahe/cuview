import { StatusBadge } from "@/components/composed/status-badge";
import { Button } from "@/components/ui/button";
import type { IpniSyncStatus } from "@/types/ipni";
import {
  getServiceHost,
  getSyncStatusLabel,
  hasSyncError,
  isSyncBehind,
} from "@/utils/ipni";

interface ProviderDetailProps {
  syncStatuses: IpniSyncStatus[];
  head: string | null;
  onSearchAd?: (cid: string) => void;
}

export function ProviderDetail({
  syncStatuses,
  head,
  onSearchAd,
}: ProviderDetailProps) {
  if (!syncStatuses.length) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        No sync status available
      </p>
    );
  }

  return (
    <div className="space-y-3 py-2">
      {head && (
        <div className="text-sm">
          <span className="text-muted-foreground">Head: </span>
          {onSearchAd ? (
            <Button
              type="button"
              className="h-auto justify-start p-0 font-mono text-xs"
              onClick={() => onSearchAd(head)}
              variant="link"
            >
              {head}
            </Button>
          ) : (
            <span className="font-mono text-xs">{head}</span>
          )}
        </div>
      )}

      <div className="space-y-2">
        {syncStatuses.map((status, idx) => (
          <SyncStatusRow key={`${status.service}-${idx}`} status={status} />
        ))}
      </div>
    </div>
  );
}

function SyncStatusRow({ status }: { status: IpniSyncStatus }) {
  const statusLabel = getSyncStatusLabel(status);
  const badgeStatus = hasSyncError(status)
    ? "error"
    : isSyncBehind(status)
      ? "warning"
      : "done";

  return (
    <div className="rounded-md border border-border/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">
          {getServiceHost(status.service)}
        </span>
        <StatusBadge status={badgeStatus} label={statusLabel} />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <Field label="Service" value={status.service} mono />
        <Field label="Remote Ad" value={status.remote_ad} mono />
        <Field
          label="Publisher Address"
          value={status.publisher_address}
          mono
        />
        <Field label="Address" value={status.address} mono />
        <Field
          label="Last Advertisement Time"
          value={
            status.last_advertisement_time
              ? new Date(status.last_advertisement_time).toLocaleString()
              : undefined
          }
        />
        {status.error && (
          <div className="col-span-2">
            <Field label="Error" value={status.error} error />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  error,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  error?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <div className="text-muted-foreground">{label}</div>
      <div
        className={`break-all ${mono ? "font-mono" : ""} ${error ? "text-destructive" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
