import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddBalanceRule } from "../-module/queries";

type SubjectType = "wallet" | "proofshare" | "f05";

interface AddRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected subject type from the trigger button */
  initialSubjectType?: SubjectType;
}

const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
  wallet: "Wallet Rule",
  proofshare: "SnarkMarket Client Rule",
  f05: "F05 Rule",
};

export function AddRuleDialog({
  open,
  onOpenChange,
  initialSubjectType = "wallet",
}: AddRuleDialogProps) {
  const [subject, setSubject] = useState("");
  const [second, setSecond] = useState("");
  const [actionType, setActionType] = useState("requester");
  const [lowWatermark, setLowWatermark] = useState("");
  const [highWatermark, setHighWatermark] = useState("");
  const subjectType = initialSubjectType;

  const mutation = useAddBalanceRule();

  // For proofshare and f05, action is always "requester"
  const effectiveActionType =
    subjectType === "wallet" ? actionType : "requester";

  // For proofshare, second is same as subject
  const effectiveSecond = subjectType === "proofshare" ? subject : second;

  const showSecondField = subjectType === "wallet" || subjectType === "f05";
  const showActionSelect = subjectType === "wallet";

  const handleSubmit = () => {
    const s = subject.trim();
    const sec = effectiveSecond.trim();
    if (!s || (!sec && showSecondField)) return;

    mutation.mutate(
      [
        s,
        sec,
        effectiveActionType,
        lowWatermark.trim(),
        highWatermark.trim(),
        subjectType,
      ],
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  };

  const resetForm = () => {
    setSubject("");
    setSecond("");
    setActionType("requester");
    setLowWatermark("");
    setHighWatermark("");
    mutation.reset();
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {SUBJECT_TYPE_LABELS[subjectType]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Subject Address *
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="f0... or f1... or f3..."
              className="font-mono text-xs"
            />
          </div>

          {showSecondField && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Second Address *
              </label>
              <Input
                value={second}
                onChange={(e) => setSecond(e.target.value)}
                placeholder="f0... or f1... or f3..."
                className="font-mono text-xs"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Action
            </label>
            {showActionSelect ? (
              <Select
                value={actionType}
                onValueChange={(value) => setActionType(value ?? "requester")}
              >
                <SelectTrigger size="sm" className="text-xs">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requester">
                    Keep Subject Above Low
                  </SelectItem>
                  <SelectItem value="active-provider">
                    Keep Subject Below High
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value="Keep Subject Above Low"
                readOnly
                className="bg-muted text-muted-foreground"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Low Watermark (FIL)
              </label>
              <Input
                value={lowWatermark}
                onChange={(e) => setLowWatermark(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                High Watermark (FIL)
              </label>
              <Input
                value={highWatermark}
                onChange={(e) => setHighWatermark(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>
          </div>

          {mutation.isError && (
            <p className="text-xs text-destructive">
              {(mutation.error as Error)?.message ?? "Failed to add rule"}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={
              mutation.isPending ||
              !subject.trim() ||
              (showSecondField && !second.trim())
            }
          >
            {mutation.isPending ? "Adding..." : "Add Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
