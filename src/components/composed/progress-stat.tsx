import { cn } from "@/lib/utils";

interface ProgressStatProps {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
  className?: string;
}

export function ProgressStat({
  label,
  value,
  max = 100,
  suffix = "%",
  className,
}: ProgressStatProps) {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            percentage >= 90
              ? "bg-destructive"
              : percentage >= 70
                ? "bg-warning"
                : "bg-primary",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
