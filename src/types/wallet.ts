export interface WalletInfo {
  Address: string;
  Name: string;
  Type: string;
  Balance: string;
}

export interface WalletInfoShort {
  id_address: string;
  key_address: string;
  balance: string;
  pending_messages: number;
}

export interface WalletBalanceInfo {
  address: string;
  balance: string;
  pendingMessages: number;
  loading: boolean;
  error?: string;
  lastUpdated?: Date;
}

export interface WalletNames {
  [address: string]: string;
}

export interface WalletBalances {
  Address: string;
  Balance: string;
}

export interface MarketBalanceStatus {
  miner: string;
  market_balance: string; // AVAILABLE market balance (Escrow - Locked), not total escrow
  balances: WalletBalances[] | null;
}

export interface MarketBalanceDisplay {
  Miner: string;
  MarketAvailable: string;
  WalletCount: number;
  TotalWalletBalance: string;
  Wallets: WalletBalances[];
}

export interface PendingMessage {
  Cid: string;
  From: string;
  To: string;
  Method: string;
  Value: string;
  GasLimit: number;
  GasFeeCap: string;
  GasPremium: string;
  Nonce: number;
  State: "pending" | "confirmed" | "failed";
  CreatedAt: string;
}

export interface PendingMessages {
  Messages: PendingMessage[];
  TotalCount: number;
}

export interface MessageDetail {
  Cid: string;
  From: string;
  To: string;
  Method: string;
  Params: string;
  Value: string;
  GasLimit: number;
  GasFeeCap: string;
  GasPremium: string;
  Nonce: number;
  Receipt?: {
    ExitCode: number;
    Return: string;
    GasUsed: number;
  };
  Height?: number;
  Timestamp?: string;
  Error?: string;
}

export interface AllowDeny {
  wallet: string;
  status: boolean;
}

export interface TransferRequest {
  miner: string;
  amount: string;
  wallet: string;
}

export interface WalletManagementRequest {
  wallet: string;
  name?: string;
  newName?: string;
}

export interface WalletFilters {
  search: string;
  type: "all" | "secp256k1" | "bls" | "multisig";
  balanceFilter: "all" | "has_balance" | "zero_balance";
}

export interface MarketBalanceFilters {
  search: string;
  miner: string;
}

export interface MessageFilters {
  search: string;
  state: "all" | "pending" | "confirmed" | "failed";
  wallet: string;
}

export interface ClientAccessFilters {
  search: string;
  status: "all" | "allowed" | "denied";
}

export interface WalletTableEntry extends WalletInfo {
  id: string;
  hasBalance: boolean;
  balanceNumber: number;
  balanceLoading?: boolean;
  balanceError?: string;
  pendingMessages?: number;
  isEditing?: boolean;
  tempName?: string;
}

export interface MarketBalanceTableEntry extends MarketBalanceDisplay {
  id: string;
  marketAvailableNumber: number;
  totalWalletBalanceNumber: number;
  WalletDetails?: WalletInfo[];
}

export interface PendingMessageTableEntry extends PendingMessage {
  id: string;
  valueNumber: number;
  gasFeeCapNumber: number;
  age: string;
}

export interface AccessControlTableEntry {
  id: string;
  wallet: string;
  status: boolean;
  statusText: "allowed" | "denied";
  statusBadgeClass: string;
}

export interface BalanceManagerRule {
  id: number;
  subject_address: string;
  second_address: string;
  action_type: "requester" | "active-provider";
  subject_type: "wallet" | "proofshare";
  low_watermark: string;
  high_watermark: string;
  task_id: number | null;
  last_msg_cid: string | null;
  last_msg_sent_at: string | null;
  last_msg_landed_at: string | null;
}

export interface BalanceManagerRuleDisplay {
  ID: number;
  SubjectAddress: string;
  SecondAddress: string;
  ActionType: "requester" | "active-provider";
  SubjectType: "wallet" | "proofshare";
  LowWatermark: string;
  HighWatermark: string;
  Status: "active" | "inactive" | "pending";
  LastMessageCid: string | null;
  LastMessageSent: string | null;
  LastMessageLanded: string | null;
}

export interface BalanceManagerTableEntry extends BalanceManagerRuleDisplay {
  id: string;
  lowWatermarkNumber: number;
  highWatermarkNumber: number;
  statusBadgeClass: string;
  actionTypeBadgeClass: string;
  age: string;
  lastActionAge: string;
}

export interface BalanceManagerRuleAddRequest {
  subject: string;
  second: string;
  actionType: "requester" | "active-provider";
  subjectType: "wallet" | "proofshare";
  lowWatermark: string;
  highWatermark: string;
}

export interface BalanceManagerRuleUpdateRequest {
  id: number;
  lowWatermark: string;
  highWatermark: string;
}

export interface BalanceManagerRuleRemoveRequest {
  id: number;
}

export interface BalanceManagerFilters {
  search: string;
  actionType: "all" | "requester" | "active-provider";
  subjectType: "all" | "wallet" | "proofshare";
  status: "all" | "active" | "inactive" | "pending";
}
