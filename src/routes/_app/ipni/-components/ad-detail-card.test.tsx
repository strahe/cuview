import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdDetailCard } from "./ad-detail-card";

describe("AdDetailCard", () => {
  it("renders raw GetAd fields that are not covered by derived labels", () => {
    render(
      <AdDetailCard
        ad={{
          ad_cid: "bafy-ad",
          ad_cids: ["bafy-ad"],
          context_id: "AQIDBA==",
          is_rm: false,
          is_skip: false,
          previous: "bafy-prev",
          sp_id: 1234,
          addresses: "/ip4/127.0.0.1/tcp/3100",
          entries: "bafy-entry-head",
          piece_cid: "bafy-piece-v1",
          piece_cid_v2: "bafy-piece-v2",
          piece_size: 2048,
          miner: "f01234",
          entry_count: 7,
          cid_count: 99,
        }}
        onToggleSkip={vi.fn()}
      />,
    );

    expect(screen.getByText("Context ID")).toBeInTheDocument();
    expect(screen.getByText("AQIDBA==")).toBeInTheDocument();
    expect(screen.getByText("SP ID")).toBeInTheDocument();
    expect(screen.getByText("1234")).toBeInTheDocument();
  });
});
