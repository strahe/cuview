import { useState } from "react";
import { StatusBadge } from "@/components/composed/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PsClientMessage } from "../-module/types";

interface ClientMessagesCardProps {
  messages: PsClientMessage[];
}

const MESSAGES_PAGE_SIZE = 20;

export function ClientMessagesCard({ messages }: ClientMessagesCardProps) {
  const [page, setPage] = useState(1);
  const [prevMessagesLength, setPrevMessagesLength] = useState(messages.length);

  if (messages.length !== prevMessagesLength) {
    setPrevMessagesLength(messages.length);
    setPage(1);
  }

  const totalPages = Math.max(
    1,
    Math.ceil(messages.length / MESSAGES_PAGE_SIZE),
  );
  const startIndex = (page - 1) * MESSAGES_PAGE_SIZE;
  const visibleMessages = messages.slice(
    startIndex,
    startIndex + MESSAGES_PAGE_SIZE,
  );

  if (messages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {visibleMessages.map((m) => (
            <div
              key={m.signed_cid}
              className="flex items-center justify-between rounded border border-border p-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono">{m.action}</span>
                <span className="text-muted-foreground">{m.started_at}</span>
                {m.success !== undefined && (
                  <StatusBadge
                    status={m.success ? "done" : "error"}
                    label={m.success ? "OK" : "Failed"}
                  />
                )}
              </div>
              <span className="truncate font-mono text-muted-foreground">
                {m.signed_cid.slice(0, 16)}...
              </span>
            </div>
          ))}
        </div>
        {messages.length > MESSAGES_PAGE_SIZE && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {(page - 1) * MESSAGES_PAGE_SIZE + 1}-
              {Math.min(page * MESSAGES_PAGE_SIZE, messages.length)} of{" "}
              {messages.length}
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
