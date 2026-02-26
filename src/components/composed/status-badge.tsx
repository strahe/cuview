import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "idle";

const variantMap: Record<
  StatusType,
  "default" | "secondary" | "destructive" | "outline"
> = {
  success: "outline",
  done: "outline",
  error: "destructive",
  failed: "destructive",
  warning: "outline",
  pending: "secondary",
  idle: "secondary",
  running: "default",
  info: "outline",
};

const classMap: Partial<Record<StatusType, string>> = {
  success: "border-success/30 text-success",
  done: "border-success/30 text-success",
  warning: "border-warning/30 text-warning",
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={variantMap[status]}
      className={cn(classMap[status], className)}
    >
      {label ?? status}
    </Badge>
  );
}
