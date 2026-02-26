import { Moon, Sun } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLayout } from "@/contexts/layout-context";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const layout = useLayout();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        {/* Appearance Mode */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Mode</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => layout.setTheme("light")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                !layout.isDark
                  ? "border-primary bg-primary/[0.1] text-primary"
                  : "border-border hover:bg-accent",
              )}
            >
              <Sun className="size-4" />
              Light
            </button>
            <button
              type="button"
              onClick={() => layout.setTheme("dark")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                layout.isDark
                  ? "border-primary bg-primary/[0.1] text-primary"
                  : "border-border hover:bg-accent",
              )}
            >
              <Moon className="size-4" />
              Dark
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
