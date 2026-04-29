import type { BalanceManagerRule } from "@/types/wallet";
import type {
  ApiWalletInfoShort,
  BalanceRuleView,
  MessageAgeSeverity,
  WalletNamesMap,
  WalletStats,
  WalletView,
} from "./types";

// ---------------------------------------------------------------------------
// Wallet list
// ---------------------------------------------------------------------------

/**
 * Converts the raw WalletNames map + per-wallet WalletInfoShort data
 * into a flat, display-ready array.
 */
export function normalizeWalletList(
  names: WalletNamesMap,
  infoMap: Record<string, ApiWalletInfoShort | undefined>,
  loadingSet: ReadonlySet<string>,
  errorSet: ReadonlySet<string>,
): WalletView[] {
  return Object.entries(names).map(([address, name]) => {
    const info = infoMap[address];
    return {
      address,
      name,
      idAddress: info?.id_address ?? null,
      keyAddress: info?.key_address ?? null,
      balance: info?.balance ?? null,
      pendingMessages: info?.pending_messages ?? null,
      isLoadingBalance: loadingSet.has(address),
      balanceError: errorSet.has(address),
    };
  });
}

/** Compute aggregate stats for KPI cards. */
export function computeWalletStats(wallets: WalletView[]): WalletStats {
  let walletsWithBalance = 0;
  let totalPendingMessages = 0;

  for (const w of wallets) {
    if (w.balance && w.balance !== "0 FIL" && w.balance !== "0") {
      walletsWithBalance++;
    }
    totalPendingMessages += w.pendingMessages ?? 0;
  }

  return {
    totalWallets: wallets.length,
    walletsWithBalance,
    totalPendingMessages,
  };
}

// ---------------------------------------------------------------------------
// Balance Manager
// ---------------------------------------------------------------------------

const ACTION_TYPE_LABELS: Record<string, string> = {
  requester: "Keep Subject Above Low",
  "active-provider": "Keep Subject Below High",
};

/** Normalize a raw BalanceMgrRule into a display-ready view model. */
export function normalizeBalanceRule(
  rule: BalanceManagerRule,
): BalanceRuleView {
  return {
    id: rule.id,
    subjectAddress: rule.subject_address,
    secondAddress: rule.second_address,
    actionType: rule.action_type,
    actionTypeLabel: ACTION_TYPE_LABELS[rule.action_type] ?? rule.action_type,
    subjectType: rule.subject_type,
    lowWatermark: rule.low_watermark,
    highWatermark: rule.high_watermark,
    taskId: rule.task_id ?? null,
    lastMsgCid: rule.last_msg_cid ?? null,
    lastMsgSentAt: rule.last_msg_sent_at ?? null,
    lastMsgLandedAt: rule.last_msg_landed_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const SIXTY_MINUTES_MS = 60 * 60 * 1000;

/**
 * Return a severity level based on message age.
 * Mirrors Curio built-in UI: <30min normal, <60min warning, >60min danger.
 */
export function getMessageAgeSeverity(addedAt: string): MessageAgeSeverity {
  const ageMs = Date.now() - new Date(addedAt).getTime();
  if (ageMs >= SIXTY_MINUTES_MS) return "danger";
  if (ageMs >= THIRTY_MINUTES_MS) return "warning";
  return "normal";
}

/** Map severity to a Tailwind text-color class. */
export function getMessageAgeColorClass(severity: MessageAgeSeverity): string {
  switch (severity) {
    case "danger":
      return "text-destructive";
    case "warning":
      return "text-warning";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Nullable field helpers (Curio uses sql.Null* wrappers)
// ---------------------------------------------------------------------------

interface NullableField<T> {
  Valid: boolean;
  String?: string;
  Int64?: number;
  Bool?: boolean;
  Time?: string;
  Float64?: number;
  value?: T;
}

/** Extract a value from a Curio nullable wrapper, or return fallback. */
export function unwrapNullable<T>(
  field: NullableField<T> | T | null | undefined,
  fallback: T,
): T {
  if (field == null) return fallback;
  if (typeof field === "object" && "Valid" in field) {
    if (!field.Valid) return fallback;
    // Each Go sql.Null* type produces exactly one typed field — detect which
    if (field.String !== undefined) return field.String as T;
    if (field.Int64 !== undefined) return field.Int64 as T;
    if (field.Bool !== undefined) return field.Bool as T;
    if (field.Time !== undefined) return field.Time as T;
    if (field.Float64 !== undefined) return field.Float64 as T;
    if (field.value !== undefined) return field.value as T;
    return fallback;
  }
  return field;
}
