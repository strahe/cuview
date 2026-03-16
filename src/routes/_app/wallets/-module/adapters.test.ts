import { describe, expect, it } from "vitest";
import type { BalanceManagerRule } from "@/types/wallet";
import {
  computeWalletStats,
  getMessageAgeColorClass,
  getMessageAgeSeverity,
  normalizeBalanceRule,
  normalizeWalletList,
  unwrapNullable,
} from "./adapters";
import type { ApiWalletInfoShort, WalletView } from "./types";

// ---------------------------------------------------------------------------
// normalizeWalletList
// ---------------------------------------------------------------------------

describe("normalizeWalletList", () => {
  const names = { f1abc: "Main Wallet", f3xyz: "Cold Storage" };
  const infoMap: Record<string, ApiWalletInfoShort> = {
    f1abc: {
      id_address: "f01234",
      key_address: "f1abc",
      balance: "10.5 FIL",
      pending_messages: 2,
    },
  };

  it("merges names with info data", () => {
    const result = normalizeWalletList(names, infoMap, new Set(), new Set());
    expect(result).toHaveLength(2);
    const main = result.find((w) => w.address === "f1abc");
    expect(main).toMatchObject({
      name: "Main Wallet",
      balance: "10.5 FIL",
      pendingMessages: 2,
      idAddress: "f01234",
    });
  });

  it("handles missing info gracefully", () => {
    const result = normalizeWalletList(
      names,
      infoMap,
      new Set(["f3xyz"]),
      new Set(),
    );
    const cold = result.find((w) => w.address === "f3xyz");
    expect(cold).toMatchObject({
      name: "Cold Storage",
      balance: null,
      isLoadingBalance: true,
    });
  });

  it("marks error wallets", () => {
    const result = normalizeWalletList(
      names,
      {},
      new Set(),
      new Set(["f1abc"]),
    );
    const main = result.find((w) => w.address === "f1abc");
    expect(main?.balanceError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeWalletStats
// ---------------------------------------------------------------------------

describe("computeWalletStats", () => {
  const wallets: WalletView[] = [
    {
      address: "f1a",
      name: "A",
      idAddress: null,
      keyAddress: null,
      balance: "10 FIL",
      pendingMessages: 3,
      isLoadingBalance: false,
      balanceError: false,
    },
    {
      address: "f1b",
      name: "B",
      idAddress: null,
      keyAddress: null,
      balance: "0 FIL",
      pendingMessages: 0,
      isLoadingBalance: false,
      balanceError: false,
    },
    {
      address: "f1c",
      name: "C",
      idAddress: null,
      keyAddress: null,
      balance: null,
      pendingMessages: null,
      isLoadingBalance: true,
      balanceError: false,
    },
  ];

  it("computes correct stats", () => {
    const stats = computeWalletStats(wallets);
    expect(stats.totalWallets).toBe(3);
    expect(stats.walletsWithBalance).toBe(1);
    expect(stats.totalPendingMessages).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// normalizeBalanceRule
// ---------------------------------------------------------------------------

describe("normalizeBalanceRule", () => {
  const rule: BalanceManagerRule = {
    id: 1,
    subject_address: "f01234",
    second_address: "f05678",
    action_type: "requester",
    subject_type: "wallet",
    low_watermark: "5 FIL",
    high_watermark: "10 FIL",
    task_id: 42,
    last_msg_cid: "bafy123",
    last_msg_sent_at: "2025-01-01T00:00:00Z",
    last_msg_landed_at: null,
  };

  it("normalizes to view model", () => {
    const view = normalizeBalanceRule(rule);
    expect(view.actionTypeLabel).toBe("Keep Subject Above Low");
    expect(view.taskId).toBe(42);
    expect(view.lastMsgCid).toBe("bafy123");
  });

  it("maps active-provider label", () => {
    const view = normalizeBalanceRule({
      ...rule,
      action_type: "active-provider",
    });
    expect(view.actionTypeLabel).toBe("Keep Subject Below High");
  });

  it("handles null optional fields", () => {
    const view = normalizeBalanceRule({
      ...rule,
      task_id: null,
      last_msg_cid: null,
    });
    expect(view.taskId).toBeNull();
    expect(view.lastMsgCid).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getMessageAgeSeverity
// ---------------------------------------------------------------------------

describe("getMessageAgeSeverity", () => {
  it("returns 'normal' for recent messages", () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(getMessageAgeSeverity(recent)).toBe("normal");
  });

  it("returns 'warning' for 30-60 minute old messages", () => {
    const older = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    expect(getMessageAgeSeverity(older)).toBe("warning");
  });

  it("returns 'danger' for 60+ minute old messages", () => {
    const old = new Date(Date.now() - 90 * 60 * 1000).toISOString();
    expect(getMessageAgeSeverity(old)).toBe("danger");
  });
});

// ---------------------------------------------------------------------------
// getMessageAgeColorClass
// ---------------------------------------------------------------------------

describe("getMessageAgeColorClass", () => {
  it("returns destructive for danger", () => {
    expect(getMessageAgeColorClass("danger")).toBe("text-destructive");
  });

  it("returns yellow for warning", () => {
    expect(getMessageAgeColorClass("warning")).toBe("text-yellow-500");
  });

  it("returns empty for normal", () => {
    expect(getMessageAgeColorClass("normal")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// unwrapNullable
// ---------------------------------------------------------------------------

describe("unwrapNullable", () => {
  it("unwraps valid NullString", () => {
    expect(unwrapNullable({ Valid: true, String: "hello" }, "")).toBe("hello");
  });

  it("returns fallback for invalid NullString", () => {
    expect(unwrapNullable({ Valid: false, String: "hello" }, "default")).toBe(
      "default",
    );
  });

  it("passes through primitive values", () => {
    expect(unwrapNullable(42, 0)).toBe(42);
    expect(unwrapNullable("text", "")).toBe("text");
  });

  it("returns fallback for null/undefined", () => {
    expect(unwrapNullable(null, "fallback")).toBe("fallback");
    expect(unwrapNullable(undefined, "fallback")).toBe("fallback");
  });

  it("unwraps valid Bool: false without skipping", () => {
    expect(unwrapNullable({ Valid: true, Bool: false }, true)).toBe(false);
  });

  it("unwraps valid Int64: 0 without skipping", () => {
    expect(unwrapNullable({ Valid: true, Int64: 0 }, -1)).toBe(0);
  });

  it("unwraps valid String: '' (empty string)", () => {
    expect(unwrapNullable({ Valid: true, String: "" }, "fallback")).toBe("");
  });

  it("unwraps valid Time field", () => {
    expect(
      unwrapNullable({ Valid: true, Time: "2025-01-01T00:00:00Z" }, ""),
    ).toBe("2025-01-01T00:00:00Z");
  });

  it("unwraps valid Float64 field", () => {
    expect(unwrapNullable({ Valid: true, Float64: 3.14 }, 0)).toBe(3.14);
  });
});
