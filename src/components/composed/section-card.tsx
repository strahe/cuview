import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionCardProps {
  title: string;
  tooltip?: string;
  icon?: LucideIcon;
  className?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionCard({
  title,
  tooltip,
  icon: Icon,
  className,
  action,
  children,
}: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-5 text-muted-foreground" />}
          <CardTitle className="text-base" title={tooltip}>
            {title}
          </CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
