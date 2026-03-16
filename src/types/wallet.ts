// Matches Go PendingMessage (json tags: message, added_at)
export interface PendingMessage {
  message: string;
  added_at: string;
}

// Matches Go PendingMessages (json tags: messages, total)
export interface PendingMessages {
  messages: PendingMessage[];
  total: number;
}

// Matches Go MessageDetail (snake_case json tags, sql.Null* wrappers)
export interface MessageDetail {
  from_key: string;
  to_addr: string;
  send_reason: string;
  send_task_id: number;
  unsigned_data: string | null;
  unsigned_cid: string;
  nonce: { Int64: number; Valid: boolean };
  signed_data: string | null;
  signed_json: unknown;
  signed_cid: string;
  send_time: { Time: string; Valid: boolean };
  send_success: { Bool: boolean; Valid: boolean };
  send_error: { String: string; Valid: boolean };
  waiter_machine_id: { Int64: number; Valid: boolean };
  executed_tsk_cid: { String: string; Valid: boolean };
  executed_tsk_epoch: { Int64: number; Valid: boolean };
  executed_msg_cid: { String: string; Valid: boolean };
  executed_msg_data: unknown;
  executed_rcpt_exitcode: { Int64: number; Valid: boolean };
  executed_rcpt_return: string | null;
  executed_rcpt_gas_used: { Int64: number; Valid: boolean };
  value_str: string;
  fee_str: string;
}

// Matches Go BalanceMgrRule (snake_case json tags)
export interface BalanceManagerRule {
  id: number;
  subject_address: string;
  second_address: string;
  action_type: "requester" | "active-provider";
  subject_type: "wallet" | "proofshare" | "f05";
  low_watermark: string;
  high_watermark: string;
  task_id: number | null;
  last_msg_cid: string | null;
  last_msg_sent_at: string | null;
  last_msg_landed_at: string | null;
}
