// HTTP API sector data structure - matches /api/sector/all response
export interface SectorItem {
  MinerID: number;
  SectorNum: number;
  SectorFiletype?: number;
  MinerAddress: string;
  HasSealed: boolean;
  HasUnsealed: boolean;
  HasSnap: boolean;
  ExpiresAt: number; // ChainEpoch
  IsOnChain: boolean;
  IsFilPlus: boolean;
  SealInfo: string;
  Proving: boolean;
  Flag: boolean;
  DealWeight: string;
  Deals: string;
}

export interface SectorsAllResponse {
  data: SectorItem[];
}

export interface SectorFilters {
  minerAddress?: string;
  isOnChain?: boolean;
  isFilPlus?: boolean;
  proving?: boolean;
  hasSealed?: boolean;
  hasUnsealed?: boolean;
  hasSnap?: boolean;
  sealInfo?: string;
  search?: string;
}
