export interface AlertHistoryItem {
  id: number;
  category: string;
  message: string;
  machine_name: string;
  severity: string;
  created_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  sent_to_plugins: boolean;
  sent_at?: string;
  comment_count: number;
}

export interface AlertHistoryListResult {
  Alerts: AlertHistoryItem[];
  Total: number;
}

export interface AlertComment {
  id: number;
  alert_id: number;
  comment: string;
  author: string;
  created_at: string;
}

export interface AlertMute {
  id: number;
  category: string;
  machine_pattern: string;
  message_pattern: string;
  reason: string;
  muted_by: string;
  created_at: string;
  expires_at?: string;
  active: boolean;
}
