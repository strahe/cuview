export interface ActorSummaryData {
  Address: string;
  CLayers: string[];
  QualityAdjustedPower: string;
  Deadlines: Deadline[];
  ActorBalance: string;
  ActorAvailable: string;
  Win1: number;
  Win7: number;
  Win30: number;
}

export interface DeadlineCount {
  Total: number;
  Active: number;
  Live: number;
  Fault: number;
  Recovering: number;
}

export interface Deadline {
  Current: boolean;
  Proven: boolean;
  PartFaulty: boolean;
  Faulty: boolean;
  Count?: DeadlineCount;
}

// Enhanced types for actor detail and management
export interface ActorDetail {
  Summary: ActorSummaryData;
  OwnerAddress: string;
  Beneficiary: string;
  WorkerAddress: string;
  WorkerBalance: string;
  PeerID: string;
  Address: string[];
  SectorSize: number;
  PendingOwnerAddress?: string;
  BeneficiaryTerm?: BeneficiaryTerm;
  PendingBeneficiaryTerm?: PendingBeneficiaryChange;
  Wallets: WalletInfo[];
}

export interface WalletInfo {
  Type: string;
  Address: string;
  Balance: string;
}

export interface BeneficiaryTerm {
  Quota: string;
  UsedQuota: string;
  Expiration: number;
}

export interface PendingBeneficiaryChange {
  NewBeneficiary: string;
  NewQuota: string;
  NewExpiration: number;
  ApprovedByBeneficiary: boolean;
  ApprovedByNominee: boolean;
}

export interface SectorBuckets {
  All: SectorBucket[];
  CC: SectorBucket[];
}

export interface SectorBucket {
  BucketEpoch: number;
  Count: number;
  QAP: string;
  Days: number;
  VestedLockedFunds: string;
}
