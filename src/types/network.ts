export interface NetBandwidthSummary {
  totalIn: number;
  totalOut: number;
  rateIn: number;
  rateOut: number;
}

export interface NetReachability {
  status: string;
  publicAddrs: string[];
}

export interface NetNodeSummary {
  node: string;
  epoch: number;
  peerCount: number;
  bandwidth: NetBandwidthSummary;
  reachability: NetReachability;
}

export interface NetSummaryResponse {
  epoch: number;
  peerCount: number;
  bandwidth: NetBandwidthSummary;
  reachability: NetReachability;
  nodeCount: number;
  nodes: NetNodeSummary[];
}
