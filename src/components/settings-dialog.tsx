import { Check, Moon, Sun } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLayout } from "@/contexts/layout-context";
import { colorThemes } from "@/lib/color-themes";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const layout = useLayout();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
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
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]",
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
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]",
              )}
            >
              <Moon className="size-4" />
              Dark
            </button>
          </div>
        </div>

        {/* Color Theme */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Color Theme</label>
          <div className="grid grid-cols-4 gap-3">
            {colorThemes.map((ct) => {
              const isActive = layout.colorTheme === ct.name;
              return (
                <button
                  key={ct.name}
                  type="button"
                  onClick={() => layout.setColorTheme(ct.name)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition",
                    isActive
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.06)]"
                      : "border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]",
                  )}
                  title={ct.label}
                >
                  <div className="relative">
                    <div
                      className="size-8 rounded-full border-2"
                      style={{
                        backgroundColor: ct.previewColor,
                        borderColor: isActive
                          ? "hsl(var(--primary))"
                          : "transparent",
                      }}
                    />
                    {isActive && (
                      <Check
                        className="absolute inset-0 m-auto size-4"
                        style={{ color: "white" }}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "font-medium",
                      isActive
                        ? "text-[hsl(var(--foreground))]"
                        : "text-[hsl(var(--muted-foreground))]",
                    )}
                  >
                    {ct.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
