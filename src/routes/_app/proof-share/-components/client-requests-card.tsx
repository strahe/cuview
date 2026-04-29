import { useState } from "react";
import { Field, FieldLabel } from "@/components/composed/form";
import { StatusBadge } from "@/components/composed/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePsClientRequests } from "../-module/queries";

const REQUESTS_PAGE_SIZE = 20;

export function ClientRequestsCard() {
  const [spIdInput, setSpIdInput] = useState("");
  const [activeSpId, setActiveSpId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: requests } = usePsClientRequests(
    activeSpId ?? 0,
    activeSpId !== null,
  );

  const [prevRequestsLength, setPrevRequestsLength] = useState<
    number | undefined
  >(requests?.length);

  if (requests?.length !== prevRequestsLength) {
    setPrevRequestsLength(requests?.length);
    setPage(1);
  }

  const totalPages = Math.max(
    1,
    Math.ceil((requests?.length ?? 0) / REQUESTS_PAGE_SIZE),
  );
  const visibleRequests = requests
    ? requests.slice((page - 1) * REQUESTS_PAGE_SIZE, page * REQUESTS_PAGE_SIZE)
    : [];

  const handleLoad = () => {
    const trimmedInput = spIdInput.trim();

    if (!/^\d+$/.test(trimmedInput)) {
      setValidationError("Enter a numeric SP ID.");
      return;
    }

    const parsed = Number.parseInt(trimmedInput, 10);
    setValidationError(null);
    setActiveSpId(parsed);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end gap-2">
          <Field className="w-auto gap-1">
            <FieldLabel className="text-xs text-muted-foreground">
              SP ID
            </FieldLabel>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="SP ID"
              value={spIdInput}
              onChange={(e) => {
                setSpIdInput(e.target.value);
                setValidationError(null);
              }}
              className="w-32 font-mono text-xs"
            />
          </Field>
          <Button size="sm" onClick={handleLoad} disabled={!spIdInput.trim()}>
            Load Requests
          </Button>
        </div>
        {validationError && (
          <p className="text-xs text-destructive">{validationError}</p>
        )}
        {requests && requests.length > 0 && (
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {visibleRequests.map((r) => (
              <div
                key={r.task_id}
                className="flex items-center justify-between rounded border border-border p-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono">#{r.task_id}</span>
                  {r.sp_id && <span className="font-mono">{r.sp_id}</span>}
                  <span>Sector: {r.sector_num}</span>
                  <StatusBadge
                    status={
                      r.done ? "done" : r.request_sent ? "info" : "pending"
                    }
                    label={
                      r.done ? "Done" : r.request_sent ? "Sent" : "Pending"
                    }
                  />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {r.request_cid && (
                    <span className="font-mono">
                      {r.request_cid.slice(0, 12)}…
                    </span>
                  )}
                  <span>{r.created_at}</span>
                  {r.done_at && <span>Done: {r.done_at}</span>}
                  {r.payment_amount && <span>{r.payment_amount}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {requests && requests.length > REQUESTS_PAGE_SIZE && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {(page - 1) * REQUESTS_PAGE_SIZE + 1}-
              {Math.min(page * REQUESTS_PAGE_SIZE, requests.length)} of{" "}
              {requests.length}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((currentPage) => currentPage - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
