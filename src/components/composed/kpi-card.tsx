import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KPICardProps {
  title?: string;
  label?: string;
  value: string | number;
  description?: string;
  subtitle?: string;
  className?: string;
}

export function KPICard({
  title,
  label,
  value,
  description,
  subtitle,
  className,
}: KPICardProps) {
  const displayTitle = title ?? label ?? "";
  const displayDescription = description ?? subtitle;

  return (
    <Card className={cn("shadow-none", className)}>
      <CardContent className="px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">
          {displayTitle}
        </p>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <p className="text-lg font-semibold leading-tight">{value}</p>
          {displayDescription && (
            <span className="text-xs text-muted-foreground">
              {displayDescription}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
