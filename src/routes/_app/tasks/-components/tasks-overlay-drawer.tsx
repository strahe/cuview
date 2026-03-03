import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TasksOverlayDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: "detail" | "analysis";
  children: ReactNode;
}

export function TasksOverlayDrawer({
  open,
  onOpenChange,
  title,
  description,
  size = "detail",
  children,
}: TasksOverlayDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Override centered dialog defaults to implement a full-height right drawer.
        className={cn(
          "!top-0 !right-0 !left-auto !h-dvh !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-l !border-border !p-0 data-open:slide-in-from-right data-closed:slide-out-to-right",
          size === "analysis"
            ? "!w-[min(920px,100vw)]"
            : "!w-[min(720px,100vw)]",
        )}
        showCloseButton
      >
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto p-6">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
