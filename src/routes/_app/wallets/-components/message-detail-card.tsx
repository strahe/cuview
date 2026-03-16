import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { unwrapNullable } from "../-module/adapters";
import { useMessageByCid } from "../-module/queries";

export function MessageDetailCard() {
  const [searchCid, setSearchCid] = useState("");
  const [queryCid, setQueryCid] = useState("");

  const { data, isLoading, isError, error } = useMessageByCid(queryCid || null);

  const sendSuccess = data
    ? unwrapNullable<boolean | null>(data.send_success, null)
    : null;

  const handleSearch = () => {
    const cid = searchCid.trim();
    if (cid) setQueryCid(cid);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Enter Message CID..."
          value={searchCid}
          onChange={(e) => setSearchCid(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          className="font-mono text-xs"
        />
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={isLoading || !searchCid.trim()}
        >
          <Search className="mr-1 size-3.5" />
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>

      {isError && (
        <p className="text-xs text-destructive">
          {(error as Error)?.message ?? "Message not found"}
        </p>
      )}

      {data && (
        <Card className="shadow-none">
          <CardContent className="px-4 py-3">
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <DetailRow label="From" value={data.from_key} mono />
              <DetailRow label="To" value={data.to_addr} mono />
              <DetailRow label="Reason" value={data.send_reason} />
              <DetailRow
                label="Task ID"
                value={data.send_task_id?.toString()}
              />
              <DetailRow label="Unsigned CID" value={data.unsigned_cid} mono />
              <DetailRow label="Signed CID" value={data.signed_cid} mono />
              <DetailRow
                label="Nonce"
                value={unwrapNullable<number | null>(
                  data.nonce,
                  null,
                )?.toString()}
              />
              <DetailRow
                label="Send Time"
                value={
                  unwrapNullable<string | null>(data.send_time, null) ??
                  undefined
                }
              />
              <DetailRow
                label="Send Success"
                value={
                  sendSuccess == null ? undefined : sendSuccess ? "Yes" : "No"
                }
              />
              <DetailRow
                label="Send Error"
                value={
                  unwrapNullable<string | null>(data.send_error, null) ??
                  undefined
                }
              />
              <DetailRow label="Value" value={data.value_str} />
              <DetailRow label="Fee" value={data.fee_str} />
              <DetailRow
                label="Executed Tipset CID"
                value={
                  unwrapNullable<string | null>(data.executed_tsk_cid, null) ??
                  undefined
                }
                mono
              />
              <DetailRow
                label="Executed Tipset Epoch"
                value={unwrapNullable<number | null>(
                  data.executed_tsk_epoch,
                  null,
                )?.toString()}
              />
              <DetailRow
                label="Executed Msg CID"
                value={
                  unwrapNullable<string | null>(data.executed_msg_cid, null) ??
                  undefined
                }
                mono
              />
              <DetailRow
                label="Exit Code"
                value={unwrapNullable<number | null>(
                  data.executed_rcpt_exitcode,
                  null,
                )?.toString()}
              />
              <DetailRow
                label="Gas Used"
                value={unwrapNullable<number | null>(
                  data.executed_rcpt_gas_used,
                  null,
                )?.toString()}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={`text-xs break-all ${mono ? "font-mono" : ""} ${
          !value ? "text-muted-foreground" : ""
        }`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}
