export const ipniQueryPrefixes = {
  summary: ["curio", "IPNISummary"] as const,
  getAd: ["curio", "GetAd"] as const,
  entry: ["curio", "IPNIEntry"] as const,
};

export const ipniQueryKeys = {
  summary: (endpoint: string) =>
    [...ipniQueryPrefixes.summary, endpoint] as const,
  getAd: (endpoint: string, cid: string) =>
    [...ipniQueryPrefixes.getAd, endpoint, cid] as const,
  entry: (endpoint: string, cid: string) =>
    [...ipniQueryPrefixes.entry, endpoint, cid] as const,
};

export const summaryInvalidateKeys: unknown[][] = [
  [...ipniQueryPrefixes.summary],
];

export const adInvalidateKeys: unknown[][] = [[...ipniQueryPrefixes.getAd]];
