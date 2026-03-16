import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUpdateBalanceRule } from "../-module/queries";

interface EditRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleId: number;
  currentLow: string;
  currentHigh: string;
}

export function EditRuleDialog({
  open,
  onOpenChange,
  ruleId,
  currentLow,
  currentHigh,
}: EditRuleDialogProps) {
  const [lowWatermark, setLowWatermark] = useState(currentLow);
  const [highWatermark, setHighWatermark] = useState(currentHigh);
  const mutation = useUpdateBalanceRule();
  const ruleSnapshot = useMemo(
    () => ({ ruleId, low: currentLow, high: currentHigh }),
    [ruleId, currentLow, currentHigh],
  );

  useEffect(() => {
    if (!open) return;
    setLowWatermark(ruleSnapshot.low);
    setHighWatermark(ruleSnapshot.high);
  }, [open, ruleSnapshot]);

  const handleSubmit = () => {
    mutation.mutate([ruleId, lowWatermark.trim(), highWatermark.trim()], {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      mutation.reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Rule #{ruleId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Low Watermark (FIL)
              </label>
              <Input
                value={lowWatermark}
                onChange={(e) => setLowWatermark(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                High Watermark (FIL)
              </label>
              <Input
                value={highWatermark}
                onChange={(e) => setHighWatermark(e.target.value)}
              />
            </div>
          </div>
          {mutation.isError && (
            <p className="text-xs text-destructive">
              {(mutation.error as Error)?.message ?? "Failed to update"}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
