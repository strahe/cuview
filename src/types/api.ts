export interface AddLayerRequest {
  Name: string;
}

export interface TopologyNode {
  Server: string;
  CPU: number;
  GPU: number;
  RAM: number;
  LayersCSV: string;
  TasksCSV: string;
}

export type ConfigLayer = Record<string, unknown>;
export type ConfigSchema = Record<string, unknown>;
export type DefaultConfig = Record<string, unknown>;

export interface Sector {
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

export interface SectorsResponse {
  data: Sector[];
}

export interface TerminateSectorRequest {
  MinerAddress: string;
  Sector: number;
}
