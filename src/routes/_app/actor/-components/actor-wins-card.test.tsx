import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { WinStat } from "@/types/win";
import { ActorWinsCard } from "./actor-wins-card";

describe("ActorWinsCard", () => {
  it("renders block ids with a tooltip-capable truncated cell", () => {
    const win: WinStat = {
      Actor: 1234,
      Epoch: 100,
      Block: "bafy2bzacec4verylongblockidentifier0123456789abcdef",
      TaskID: 99,
      SubmittedAt: null,
      Included: true,
      BaseComputeTime: null,
      MinedAt: null,
      SubmittedAtStr: "2026-03-15 09:00",
      TaskSuccess: "ok",
      IncludedStr: "yes",
      ComputeTime: "1s",
      Miner: "f01234",
    };
    const wins: WinStat[] = [win];

    const { container } = render(
      <TooltipProvider>
        <ActorWinsCard wins={wins} />
      </TooltipProvider>,
    );

    const blockNode = container.querySelector(
      "span[data-slot='tooltip-trigger']",
    );
    expect(blockNode).not.toBeNull();
    expect(blockNode).toHaveTextContent(win.Block);
    expect(blockNode).toHaveClass("truncate");
  });
});
