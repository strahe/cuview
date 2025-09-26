export interface IpniSyncStatus {
  service: string;
  remote_ad: string;
  publisher_address: string;
  address: string;
  last_advertisement_time?: string;
  error?: string;
}

export interface IpniProviderSummary {
  sp_id: number;
  peer_id: string;
  head: string | null;
  miner: string;
  sync_status?: IpniSyncStatus[];
}

export interface IpniAdDetail {
  ad_cid: string;
  context_id: string;
  is_rm: boolean;
  is_skip: boolean;
  previous: string;
  sp_id: number;
  addresses: string;
  entries: string;
  piece_cid: string;
  piece_size: number;
  miner: string;
  entry_count: number;
  cid_count: number;
  ad_cids: string[];
}

export interface IpniAdRow extends IpniAdDetail {
  peerId: string;
  providerHead: string | null;
}

export interface IpniAdFailure {
  miner: string;
  peerId: string;
  head: string | null;
  error: string;
}

export interface IpniEntryInfo {
  PieceCID: string;
  FromCar: boolean;
  FirstCID?: string | null | { "/": string };
  StartOffset?: number | null;
  NumBlocks: number;
  PrevCID?: string | null | { "/": string };
  Err?: string | null;
  Size: number;
}
