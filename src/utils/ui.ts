export const getTaskBadgeColor = (taskType: string): string => {
  if (!taskType) return "badge-outline";

  // Use badge-outline for all categorical task types per design standards
  return "badge-outline";
};

export const getTaskStatusBadgeColor = (outcome: string): string => {
  switch (outcome.toLowerCase()) {
    case "success":
      return "badge-success";
    case "failed":
    case "error":
      return "badge-error";
    case "running":
    case "active":
      return "badge-info";
    case "pending":
    case "queued":
      return "badge-warning";
    default:
      return "badge-neutral";
  }
};

export const getMachineStatusStyle = (status: string) => {
  const styles = {
    healthy: {
      color: "success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
    },
    offline: {
      color: "error",
      bgColor: "bg-error/10",
      borderColor: "border-error/20",
    },
    cordoned: {
      color: "warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
    },
    "high-load": {
      color: "warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
    },
    unknown: {
      color: "neutral",
      bgColor: "bg-neutral/10",
      borderColor: "border-neutral/20",
    },
  };
  return styles[status as keyof typeof styles] || styles.unknown;
};

export const getProgressColor = (percentage: number): string => {
  if (percentage < 70) return "progress-success";
  if (percentage < 90) return "progress-warning";
  return "progress-error";
};

export const getPercentageTextColor = (percentage: number): string => {
  if (percentage < 70) return "text-success";
  if (percentage < 90) return "text-warning";
  return "text-error";
};

export const getVolumeTypeBadgeColor = (
  canSeal: boolean,
  canStore: boolean,
): string => {
  if (canSeal && canStore) return "badge-primary";
  if (canSeal) return "badge-info";
  if (canStore) return "badge-secondary";
  return "badge-neutral";
};

export const getContactStatusColor = (lastContact: string | number): string => {
  const contactTime =
    typeof lastContact === "string" ? parseInt(lastContact) : lastContact;
  return contactTime > 60 ? "text-error" : "text-success";
};

export const getCardClasses = (
  variant: "default" | "outlined" | "filled" = "default",
): string => {
  const baseClasses = "card bg-base-100";

  switch (variant) {
    case "outlined":
      return `${baseClasses} border border-base-300`;
    case "filled":
      return `${baseClasses} bg-base-200/50`;
    default:
      return `${baseClasses} shadow-lg`;
  }
};

export const getLoadingSpinnerClasses = (
  size: "sm" | "md" | "lg" = "md",
): string => {
  const baseClasses = "loading loading-spinner text-primary";
  const sizeClasses = {
    sm: "loading-sm",
    md: "",
    lg: "loading-lg",
  };
  return `${baseClasses} ${sizeClasses[size]}`.trim();
};

export const getIconColor = (status: string): string => {
  const colors = {
    success: "text-success",
    error: "text-error",
    warning: "text-warning",
    info: "text-info",
    primary: "text-primary",
    secondary: "text-secondary",
    neutral: "text-base-content/60",
  };
  return colors[status as keyof typeof colors] || colors.neutral;
};

export const getTableRowClasses = (clickable: boolean = false): string => {
  const baseClasses = "hover:bg-base-200/30 transition-colors";
  return clickable ? `${baseClasses} cursor-pointer` : baseClasses;
};

export const getButtonVariantClasses = (
  variant:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "ghost"
    | "outline" = "primary",
): string => {
  return `btn btn-${variant}`;
};

export const getDeadlineSquareClasses = (deadline: {
  Proven?: boolean;
  PartFaulty?: boolean;
  Faulty?: boolean;
  Current?: boolean;
  Count?: {
    Fault?: number;
    Recovering?: number;
    Live?: number;
    Active?: number;
  };
}): string => {
  const baseClasses =
    "deadline-square bg-base-300 border border-base-content/20 rounded-sm transition-shadow duration-200";
  const classes = [baseClasses];

  // Determine status based on count first
  if (deadline.Count) {
    const { Fault = 0, Recovering = 0, Live = 0, Active = 0 } = deadline.Count;

    if (Fault > 0 && Recovering === 0) {
      classes.push("!bg-error !border-error");
    } else if (Fault > 0 || Recovering > 0) {
      classes.push("!bg-warning !border-warning");
    } else if (Live > 0 || Active > 0) {
      classes.push("!bg-success !border-success");
    }
  }

  // Override with direct flags if present
  if (deadline.Proven) classes.push("!bg-success !border-success");
  if (deadline.PartFaulty) classes.push("!bg-warning !border-warning");
  if (deadline.Faulty) classes.push("!bg-error !border-error");

  // Current deadline styling
  if (deadline.Current) {
    classes.push("!border-b-[3px] !border-info");
    // If current has no other status, use blue background
    if (!deadline.Proven && !deadline.PartFaulty && !deadline.Faulty) {
      classes.push("!bg-info !border-info");
    }
  }

  return classes.join(" ");
};
