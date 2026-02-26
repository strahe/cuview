import type { StorageUseStat } from "@/types/storage";

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

export const getStorageTypeLabel = (stat?: StorageUseStat | null): string => {
  if (!stat) return "";

  if (stat.CanSeal === false && stat.CanStore === false) {
    return "Readonly";
  }

  return stat.Type === "None" ? "Readonly" : stat.Type;
};

export const getContactStatusColor = (lastContact: string | number): string => {
  const contactTime =
    typeof lastContact === "string" ? parseInt(lastContact, 10) : lastContact;
  return contactTime > 60 ? "text-error" : "text-success";
};

export const getCardClasses = (
  variant: "default" | "outlined" | "filled" = "default",
): string => {
  const baseClasses = "card";

  switch (variant) {
    case "outlined":
      return `${baseClasses} bg-base-100 border border-base-300`;
    case "filled":
      return `${baseClasses} bg-base-200 border border-base-300 shadow-sm`;
    default:
      return `${baseClasses} bg-base-100 shadow-lg`;
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
  const baseClasses = [
    "transition-colors",
    "duration-150",
    "hover:bg-base-300",
    "focus-within:bg-base-300",
    "hover:text-base-content",
    "focus-within:text-base-content",
    "hover:shadow-sm",
    "focus-within:shadow-sm",
    "focus-visible:outline-none",
  ];

  if (clickable) {
    baseClasses.push("cursor-pointer");
  }

  return baseClasses.join(" ");
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

export const getKPICardClasses = (
  value: number,
  status: "success" | "error" | "warning" | "info" = "info",
): string => {
  if (value <= 0) return "";

  const statusMap = {
    success: "bg-success/10",
    error: "bg-error/10",
    warning: "bg-warning/10",
    info: "bg-info/10",
  };

  return statusMap[status];
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

// Actor health status colors
export const getActorHealthBadgeColor = (healthScore: number): string => {
  if (healthScore >= 80) return "badge-success";
  if (healthScore >= 60) return "badge-warning";
  return "badge-error";
};

export const getActorHealthStyle = (healthScore: number) => {
  if (healthScore >= 80) {
    return {
      color: "success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
    };
  }
  if (healthScore >= 60) {
    return {
      color: "warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
    };
  }
  return {
    color: "error",
    bgColor: "bg-error/10",
    borderColor: "border-error/20",
  };
};

export const getActorHealthTextColor = (healthScore: number): string => {
  if (healthScore >= 80) return "text-success";
  if (healthScore >= 60) return "text-warning";
  return "text-error";
};

// Actor balance status colors
export const getBalanceStatusColor = (isPositive: boolean): string => {
  return isPositive ? "text-success" : "text-base-content/60";
};

// Wallet type colors
export const getWalletTypeBadgeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case "owner":
      return "badge-primary";
    case "worker":
      return "badge-secondary";
    case "control":
      return "badge-accent";
    case "beneficiary":
      return "badge-info";
    default:
      return "badge-neutral";
  }
};

export const getWalletTypeStyle = (type: string) => {
  switch (type.toLowerCase()) {
    case "owner":
      return {
        color: "primary",
        bgColor: "bg-primary/10",
        textColor: "text-primary",
      };
    case "worker":
      return {
        color: "secondary",
        bgColor: "bg-secondary/10",
        textColor: "text-secondary",
      };
    case "control":
      return {
        color: "accent",
        bgColor: "bg-accent/10",
        textColor: "text-accent",
      };
    case "beneficiary":
      return {
        color: "info",
        bgColor: "bg-info/10",
        textColor: "text-info",
      };
    default:
      return {
        color: "neutral",
        bgColor: "bg-neutral/10",
        textColor: "text-neutral",
      };
  }
};

// Actor utilization colors based on percentage
export const getUtilizationColor = (percentage: number): string => {
  if (percentage > 80) return "bg-warning";
  return "bg-success";
};

// Win trend colors
export const getWinTrendColor = (trend: "up" | "down" | "neutral"): string => {
  switch (trend) {
    case "up":
      return "text-success";
    case "down":
      return "text-error";
    default:
      return "text-base-content";
  }
};

// Actor KPI card styles
export const getActorKPICardStyle = (
  type: "balance" | "power" | "wins" | "worker",
) => {
  switch (type) {
    case "balance":
      return {
        gradient: "from-success/10 to-success/5",
        border: "border-success/20",
        bgColor: "bg-success/10",
        textColor: "text-success",
      };
    case "power":
      return {
        gradient: "from-primary/10 to-primary/5",
        border: "border-primary/20",
        bgColor: "bg-primary/10",
        textColor: "text-primary",
      };
    case "wins":
      return {
        gradient: "from-warning/10 to-warning/5",
        border: "border-warning/20",
        bgColor: "bg-warning/10",
        textColor: "text-warning",
      };
    case "worker":
      return {
        gradient: "from-info/10 to-info/5",
        border: "border-info/20",
        bgColor: "bg-info/10",
        textColor: "text-info",
      };
  }
};

// Actor stats card styles
export const getActorStatsCardStyle = (
  type: "performance" | "financial" | "governance",
) => {
  switch (type) {
    case "performance":
      return {
        gradient: "from-primary/5 to-primary/10",
        border: "border-primary/20",
        bgColor: "bg-primary/10",
        textColor: "text-primary",
      };
    case "financial":
      return {
        gradient: "from-success/5 to-success/10",
        border: "border-success/20",
        bgColor: "bg-success/10",
        textColor: "text-success",
      };
    case "governance":
      return {
        gradient: "from-info/5 to-info/10",
        border: "border-info/20",
        bgColor: "bg-info/10",
        textColor: "text-info",
      };
  }
};

// Actor detail panel card styles
export const getActorDetailCardStyle = (
  type: "identity" | "deadlines" | "performance" | "beneficiary",
) => {
  switch (type) {
    case "identity":
      return {
        gradient: "from-secondary/5 to-secondary/10",
        border: "border-secondary/20",
        bgColor: "bg-secondary/10",
        textColor: "text-secondary",
      };
    case "deadlines":
      return {
        gradient: "from-accent/5 to-accent/10",
        border: "border-accent/20",
        bgColor: "bg-accent/10",
        textColor: "text-accent",
      };
    case "performance":
      return {
        gradient: "from-warning/5 to-warning/10",
        border: "border-warning/20",
        bgColor: "bg-warning/10",
        textColor: "text-warning",
      };
    case "beneficiary":
      return {
        gradient: "from-info/5 to-info/10",
        border: "border-info/20",
        bgColor: "bg-info/10",
        textColor: "text-info",
      };
  }
};

// Actor win performance text colors
export const getWinPerformanceTextColor = (
  period: "1d" | "7d" | "30d",
): string => {
  switch (period) {
    case "1d":
      return "text-error";
    case "7d":
      return "text-warning";
    case "30d":
      return "text-success";
    default:
      return "text-base-content";
  }
};

// Chart theme utilities
export interface ChartThemeTokens {
  axis: string;
  axisSubtle: string;
  grid: string;
  legend: string;
  tooltipSurface: string;
  tooltipBorder: string;
  tooltipText: string;
  markerStroke: string;
}

const CHART_OPACITY = {
  LIGHT: {
    AXIS_SUBTLE: 35,
    GRID: 15,
    LEGEND: 80,
    TOOLTIP_BORDER: 22,
  },
  DARK: {
    AXIS_SUBTLE: 45,
    GRID: 18,
    LEGEND: 85,
    TOOLTIP_BORDER: 28,
  },
} as const;

const mixColor = (baseColor: string, opacity: number): string =>
  `color-mix(in srgb, var(--color-${baseColor}) ${opacity}%, transparent)`;

const mixColorWithBase = (
  color1: string,
  weight1: number,
  color2: string,
  weight2: number,
): string =>
  `color-mix(in srgb, var(--color-${color1}) ${weight1}%, var(--color-${color2}) ${weight2}%)`;

export const getChartThemeTokens = (isDark: boolean): ChartThemeTokens => {
  if (isDark) {
    return {
      axis: "var(--color-base-content)",
      axisSubtle: mixColor("base-content", CHART_OPACITY.DARK.AXIS_SUBTLE),
      grid: mixColor("base-content", CHART_OPACITY.DARK.GRID),
      legend: mixColor("base-content", CHART_OPACITY.DARK.LEGEND),
      tooltipSurface: mixColorWithBase("base-300", 70, "base-200", 30),
      tooltipBorder: mixColor(
        "base-content",
        CHART_OPACITY.DARK.TOOLTIP_BORDER,
      ),
      tooltipText: "var(--color-base-content)",
      markerStroke: "var(--color-base-100)",
    };
  }

  return {
    axis: "var(--color-base-content)",
    axisSubtle: mixColor("base-content", CHART_OPACITY.LIGHT.AXIS_SUBTLE),
    grid: mixColor("base-content", CHART_OPACITY.LIGHT.GRID),
    legend: mixColor("base-content", CHART_OPACITY.LIGHT.LEGEND),
    tooltipSurface: mixColorWithBase("base-100", 92, "base-200", 8),
    tooltipBorder: mixColor("base-content", CHART_OPACITY.LIGHT.TOOLTIP_BORDER),
    tooltipText: "var(--color-base-content)",
    markerStroke: "#ffffff",
  };
};
