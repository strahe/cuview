// Matches Go AlertHistoryEntry (json tags are PascalCase)
export interface AlertHistoryItem {
  ID: number;
  AlertName: string;
  Message: string;
  MachineName: string | null;
  CreatedAt: string;
  Acknowledged: boolean;
  AcknowledgedBy: string | null;
  AcknowledgedAt: string | null;
  SentToPlugins: boolean;
  SentAt: string | null;
  CommentCount: number;
}

export interface AlertHistoryListResult {
  Alerts: AlertHistoryItem[];
  Total: number;
}

// Matches Go AlertComment (json tags are PascalCase)
export interface AlertComment {
  ID: number;
  AlertID: number;
  Comment: string;
  CreatedBy: string;
  CreatedAt: string;
}

// Matches Go AlertMute (json tags are PascalCase)
export interface AlertMute {
  ID: number;
  AlertName: string;
  Pattern: string | null;
  Reason: string;
  MutedBy: string;
  MutedAt: string;
  ExpiresAt: string | null;
  Active: boolean;
}
