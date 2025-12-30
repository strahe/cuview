import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  loading?: boolean;
  className?: string;
}

export function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  loading,
  className,
}: KPICardProps) {
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
            {title}
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
        {description && (
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
