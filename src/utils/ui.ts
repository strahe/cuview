export const getTaskBadgeColor = (taskType: string): string => {
  if (!taskType) return "badge-neutral";

  // Simple hash function for consistent color assignment

  let hash = 0;
  for (let i = 0; i < taskType.length; i++) {
    hash = ((hash << 5) - hash + taskType.charCodeAt(i)) & 0xffffffff;
  }

  // Available badge colors for task types
  const badgeColors = [
    "badge-primary",
    "badge-secondary",
    "badge-accent",
    "badge-info",
    "badge-success",
    "badge-warning",
  ];

  // Use absolute value and modulo to get consistent color index
  const colorIndex = Math.abs(hash) % badgeColors.length;
  return badgeColors[colorIndex];
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
