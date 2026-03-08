import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface RestartConfirmButtonProps {
  label: string;
  confirmMessage: string;
  onConfirm: () => void;
  isPending: boolean;
}

export function RestartConfirmButton({
  label,
  confirmMessage,
  onConfirm,
  isPending,
}: RestartConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-destructive">{confirmMessage}</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            onConfirm();
            setConfirming(false);
          }}
          disabled={isPending}
        >
          Yes
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          No
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setConfirming(true)}
      disabled={isPending}
    >
      <RotateCcw className="mr-1 size-3" /> {label}
    </Button>
  );
}
