import type { SqlNullableNumber, SqlNullableString } from "@/types/sql";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface PsMeta {
  enabled: boolean;
  wallet: SqlNullableString | null;
  request_task_id: SqlNullableNumber | null;
  price: string;
}

export interface PsQueueItem {
  service_id: string;
  obtained_at: string;
  compute_task_id: SqlNullableNumber | null;
  compute_done: boolean;
  submit_task_id: SqlNullableNumber | null;
  submit_done: boolean;
  was_pow: boolean;
  payment_amount: string;
}

export interface PsPaymentSummary {
  wallet_id: number;
  last_payment_nonce: number;
  address: string;
  unsettled_amount_fil?: string;
  last_settled_amount_fil?: string;
  time_since_last_settlement?: string;
  last_settled_at?: string;
  contract_settled_fil?: string;
  contract_last_nonce?: number;
}

export interface PsWorkAsk {
  id: number;
  min_price_nfil: number;
  created_at: string;
  min_price_fil: string;
}

export interface PsSettlement {
  provider_id: number;
  payment_nonce: number;
  settled_at: string;
  settle_message_cid: string;
  address: string;
  amount_for_this_settlement_fil: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface PsClientSettings {
  sp_id: number;
  enabled: boolean;
  wallet: SqlNullableString | null;
  minimum_pending_seconds: number;
  do_porep: boolean;
  do_snap: boolean;
  address: string;
  price: string;
}

export interface PsClientWallet {
  wallet: number;
  address: string;
  chain_balance: string;
  router_avail_balance: string;
  router_unsettled_balance: string;
  router_unlocked_balance: string;
  available_balance: string;
  withdraw_timestamp?: string;
}

export interface PsClientRequest {
  task_id: number;
  sp_id: string;
  sector_num: number;
  request_cid?: string;
  request_uploaded: boolean;
  request_sent: boolean;
  done: boolean;
  created_at: string;
  done_at?: string;
  payment_amount?: string;
  payment_wallet?: number;
  payment_nonce?: number;
  response_data?: string;
}

export interface PsClientMessage {
  started_at: string;
  signed_cid: string;
  wallet: number;
  action: string;
  success?: boolean;
  completed_at?: string;
  address: string;
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export interface PsTos {
  provider: string;
  client: string;
}
