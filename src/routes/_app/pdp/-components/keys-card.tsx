import { Key, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Field, FieldLabel } from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/utils/error-log";
import { useImportPdpKey, useRemovePdpKey } from "../-module/queries";

interface KeysCardProps {
  keys: string[];
  loading: boolean;
}

export function KeysCard({ keys, loading }: KeysCardProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [confirmRemoveKey, setConfirmRemoveKey] = useState<string | null>(null);

  const removeMutation = useRemovePdpKey();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="size-4" /> PDP Keys
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImportDialog(true)}
          >
            <Plus data-icon="inline-start" /> Import Key
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
          ) : keys.length > 0 ? (
            <ul className="space-y-2">
              {keys.map((key) => (
                <li
                  key={key}
                  className="flex items-center justify-between rounded-md border border-border p-2"
                >
                  <span className="font-mono text-xs">{key}</span>
                  {confirmRemoveKey === key ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          removeMutation.mutate([key], {
                            onSettled: () => setConfirmRemoveKey(null),
                          });
                        }}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmRemoveKey(null)}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmRemoveKey(key)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="border-0 py-4">
              <EmptyHeader>
                <EmptyTitle>No PDP keys configured</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        {showImportDialog ? (
          <ImportKeyDialogContent onOpenChange={setShowImportDialog} />
        ) : null}
      </Dialog>
    </>
  );
}

function ImportKeyDialogContent({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const [keyHex, setKeyHex] = useState("");
  const mountedRef = useRef(true);
  const importMutation = useImportPdpKey();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleClose = () => {
    setKeyHex("");
    importMutation.reset();
    onOpenChange(false);
  };

  const handleImport = useCallback(() => {
    if (!keyHex.trim()) return;

    importMutation.mutate([keyHex.trim()], {
      onSuccess: () => {
        if (mountedRef.current) {
          setKeyHex("");
          onOpenChange(false);
        }
      },
    });
  }, [importMutation, keyHex, onOpenChange]);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Import PDP Key</DialogTitle>
      </DialogHeader>
      <Field>
        <FieldLabel>Private Key (hex) *</FieldLabel>
        <Input
          type="password"
          value={keyHex}
          onChange={(e) => setKeyHex(e.target.value)}
          placeholder="Hex-encoded private key"
          className="font-mono text-xs"
          autoComplete="off"
        />
      </Field>
      {importMutation.isError && (
        <p className="text-sm text-destructive">
          {getErrorMessage(importMutation.error, "Failed to import key")}
        </p>
      )}
      <DialogFooter>
        <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          type="button"
          onClick={handleImport}
          disabled={importMutation.isPending || !keyHex.trim()}
        >
          {importMutation.isPending && (
            <Spinner
              aria-hidden="true"
              data-icon="inline-start"
              className="size-3"
            />
          )}
          {importMutation.isPending ? "Importing..." : "Import Key"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
