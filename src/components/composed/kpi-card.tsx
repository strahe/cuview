import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface KPICardProps {
  title?: string;
  label?: string;
  value: string | number;
  description?: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  loading?: boolean;
  className?: string;
}

export function KPICard({
  title,
  label,
  value,
  description,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  loading,
  className,
}: KPICardProps) {
  const displayTitle = title ?? label ?? "";
  const displayDescription = description ?? subtitle;
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="mb-1 h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            {displayTitle}
          </p>
          {Icon && (
            <Icon className="size-4 text-[hsl(var(--muted-foreground))]" />
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-bold">{value}</p>
          {trend && trendValue && (
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-[hsl(var(--success))]",
                trend === "down" && "text-[hsl(var(--destructive))]",
                trend === "neutral" && "text-[hsl(var(--muted-foreground))]",
              )}
            >
              {trendValue}
            </span>
          )}
        </div>
        {displayDescription && (
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            {displayDescription}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
