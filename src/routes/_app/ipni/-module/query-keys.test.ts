import { describe, expect, it } from "vitest";
import {
  adInvalidateKeys,
  ipniQueryKeys,
  ipniQueryPrefixes,
  summaryInvalidateKeys,
} from "./query-keys";

describe("ipni query keys", () => {
  it("builds endpoint-scoped RPC query keys", () => {
    expect(ipniQueryKeys.summary("ws://localhost:4701/api/webrpc/v0")).toEqual([
      "curio",
      "IPNISummary",
      "ws://localhost:4701/api/webrpc/v0",
    ]);
    expect(
      ipniQueryKeys.getAd("ws://localhost:4701/api/webrpc/v0", "bafy-ad-123"),
    ).toEqual([
      "curio",
      "GetAd",
      "ws://localhost:4701/api/webrpc/v0",
      "bafy-ad-123",
    ]);
    expect(
      ipniQueryKeys.entry(
        "ws://localhost:4701/api/webrpc/v0",
        "bafy-entry-456",
      ),
    ).toEqual([
      "curio",
      "IPNIEntry",
      "ws://localhost:4701/api/webrpc/v0",
      "bafy-entry-456",
    ]);
  });

  it("keeps invalidation keys as method prefixes", () => {
    expect(summaryInvalidateKeys).toEqual([ipniQueryPrefixes.summary]);
    expect(adInvalidateKeys).toEqual([ipniQueryPrefixes.getAd]);
  });
});
