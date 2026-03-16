import type { BalanceManagerRule, MessageDetail } from "@/types/wallet";

/** Raw response from WalletNames RPC: address → friendly name */
export type WalletNamesMap = Record<string, string>;

/** Raw response from WalletInfoShort RPC */
export interface ApiWalletInfoShort {
  id_address: string;
  key_address: string;
  balance: string;
  pending_messages: number;
}

/** Normalized view model for a wallet row */
export interface WalletView {
  address: string;
  name: string;
  idAddress: string | null;
  keyAddress: string | null;
  balance: string | null;
  pendingMessages: number | null;
  isLoadingBalance: boolean;
  balanceError: boolean;
}

/** Aggregated stats for KPI cards */
export interface WalletStats {
  totalWallets: number;
  walletsWithBalance: number;
  totalPendingMessages: number;
}

/** Normalized view model for balance manager rule */
export interface BalanceRuleView {
  id: number;
  subjectAddress: string;
  secondAddress: string;
  actionType: string;
  actionTypeLabel: string;
  subjectType: string;
  lowWatermark: string;
  highWatermark: string;
  taskId: number | null;
  lastMsgCid: string | null;
  lastMsgSentAt: string | null;
  lastMsgLandedAt: string | null;
}

/** Message age severity for visual styling */
export type MessageAgeSeverity = "normal" | "warning" | "danger";

/** Re-export API types used across the module */
export type { BalanceManagerRule, MessageDetail };
