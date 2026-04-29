import { Progress } from "@/components/ui/progress";
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
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}
          {suffix}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          percentage >= 90 &&
            "[&_[data-slot=progress-indicator]]:bg-destructive",
          percentage >= 70 &&
            percentage < 90 &&
            "[&_[data-slot=progress-indicator]]:bg-warning",
        )}
      />
    </div>
  );
}
