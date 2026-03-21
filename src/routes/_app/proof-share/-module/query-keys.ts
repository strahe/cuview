export const psQueryKeys = {
  // Provider
  meta: ["curio", "PSGetMeta"],
  queue: ["curio", "PSListQueue"],
  asks: ["curio", "PSListAsks"],
  paymentSummary: ["curio", "PSProviderLastPaymentsSummary"],
  settlements: ["curio", "PSListSettlements"],

  // Client
  clientSettings: ["curio", "PSClientGet"],
  clientWallets: ["curio", "PSClientWallets"],
  clientRequests: ["curio", "PSClientRequests"],
  clientMessages: ["curio", "PSClientListMessages"],
  tos: ["curio", "PSGetTos"],
};

// Invalidation key groups --------------------------------------------------

export const providerMetaInvalidateKeys: unknown[][] = [psQueryKeys.meta];

export const providerAsksInvalidateKeys: unknown[][] = [psQueryKeys.asks];

export const providerSettlementsInvalidateKeys: unknown[][] = [
  psQueryKeys.settlements,
  psQueryKeys.paymentSummary,
];

export const clientSettingsInvalidateKeys: unknown[][] = [
  psQueryKeys.clientSettings,
];

export const clientWalletsInvalidateKeys: unknown[][] = [
  psQueryKeys.clientWallets,
];
