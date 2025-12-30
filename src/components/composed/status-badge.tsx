import { Badge, type BadgeProps } from "@/components/ui/badge";

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

const variantMap: Record<StatusType, BadgeProps["variant"]> = {
  success: "success",
  done: "success",
  error: "destructive",
  failed: "destructive",
  warning: "warning",
  pending: "secondary",
  idle: "secondary",
  running: "default",
  info: "outline",
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge variant={variantMap[status]} className={className}>
      {label ?? status}
    </Badge>
  );
}
