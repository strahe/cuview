export interface SectorListItem {
  MinerID: number;
  SectorNum: number;
  MinerAddress: string;
  HasSealed: boolean;
  HasUnsealed: boolean;
  HasSnap: boolean;
  ExpiresAt: number;
  IsOnChain: boolean;
  IsFilPlus: boolean;
  SealInfo: string;
  Proving: boolean;
  Flag: boolean;
  DealWeight: string;
  Deals: string;
}

export interface SectorTerminationPayload {
  MinerAddress: string;
  Sector: number;
}

export type SectorDetail = Record<string, unknown>;
