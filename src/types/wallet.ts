// Wallet management types based on Curio RPC API documentation

export interface WalletInfo {
  Address: string;
  Name: string;
  Type: string;
  Balance: string;
}

// Enhanced wallet interface based on Curio's WalletInfoShort API
export interface WalletInfoShort {
  id_address: string;
  key_address: string;
  balance: string;
  pending_messages: number;
}

// Enhanced wallet balance info for async loading
export interface WalletBalanceInfo {
  address: string;
  balance: string;
  loading: boolean;
  error?: string;
  lastUpdated?: Date;
}

export interface WalletNames {
  [address: string]: string;
}

export interface MarketBalanceStatus {
  Miner: string;
  Balance: string;
  EscrowBalance: string;
  LockedBalance: string;
  Available: string;
  Wallets: WalletInfo[];
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
  Wallet: string;
  Allow: boolean;
  Status: "allowed" | "denied";
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

export interface AccessControlFilters {
  search: string;
  status: "all" | "allowed" | "denied";
}

// Extended wallet info for table display with enhanced features
export interface WalletTableEntry extends WalletInfo {
  id: string; // Address used as unique identifier
  hasBalance: boolean;
  balanceNumber: number; // For sorting purposes
  balanceLoading?: boolean; // Individual balance loading state
  balanceError?: string; // Individual balance error
  pendingMessages?: number; // Number of pending messages
  isEditing?: boolean; // Inline editing state
  tempName?: string; // Temporary name during editing
}

// Market balance table entry
export interface MarketBalanceTableEntry extends MarketBalanceStatus {
  id: string; // Miner used as unique identifier
  totalBalance: number; // For numeric sorting
  availableNumber: number; // For sorting
}

// Pending message table entry
export interface PendingMessageTableEntry extends PendingMessage {
  id: string; // Cid used as unique identifier
  valueNumber: number; // For sorting
  gasFeeCapNumber: number; // For sorting
  age: string; // Human readable time since creation
}

// Access control table entry
export interface AccessControlTableEntry extends AllowDeny {
  id: string; // Wallet used as unique identifier
  statusBadgeClass: string; // CSS class for status badge
}
