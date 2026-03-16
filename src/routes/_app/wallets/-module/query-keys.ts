export const walletQueryKeys = {
  // Wallet list
  names: ["curio", "WalletNames"] as const,
  infoShort: ["curio", "WalletInfoShort"] as const,

  // Balance Manager
  balanceRules: ["curio", "BalanceMgrRules"] as const,

  // Messages
  pendingMessages: ["curio", "PendingMessages"] as const,
  messageByCid: (cid: string) => ["curio", "MessageByCid", cid] as const,
};

export const walletInvalidateKeys: unknown[][] = [
  [...walletQueryKeys.names],
  [...walletQueryKeys.infoShort],
];

export const balanceRuleInvalidateKeys: unknown[][] = [
  [...walletQueryKeys.balanceRules],
];
