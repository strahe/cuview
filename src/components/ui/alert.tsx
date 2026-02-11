import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-[hsl(var(--foreground))] [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]",
        destructive:
          "border-[hsl(var(--destructive))]/50 text-[hsl(var(--destructive))] [&>svg]:text-[hsl(var(--destructive))]",
        success:
          "border-[hsl(var(--success))]/50 text-[hsl(var(--success))] [&>svg]:text-[hsl(var(--success))]",
        warning:
          "border-[hsl(var(--warning))]/50 text-[hsl(var(--warning))] [&>svg]:text-[hsl(var(--warning))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: ReactNode;
}

const iconMap = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
};

function Alert({
  className,
  variant = "default",
  icon,
  children,
  ...props
}: AlertProps) {
  const IconComponent = iconMap[variant ?? "default"];
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon ?? <IconComponent className="size-4" />}
      <div>{children}</div>
    </div>
  );
}

export { Alert, alertVariants };
