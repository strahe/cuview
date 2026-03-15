import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Deadline } from "@/types/actor";
import { DeadlineMiniBar } from "./deadline-mini-bar";

const makeDeadline = (overrides: Partial<Deadline> = {}): Deadline => ({
  Empty: true,
  Current: false,
  Proven: false,
  PartFaulty: false,
  Faulty: false,
  Count: undefined,
  PartitionCount: 0,
  PartitionsPosted: 0,
  PartitionsProven: false,
  OpenAt: "",
  ElapsedMinutes: 0,
  ...overrides,
});

describe("DeadlineMiniBar", () => {
  it("keeps current deadlines compact without heavy ring styling", () => {
    const { container } = render(
      <DeadlineMiniBar deadlines={[makeDeadline({ Current: true })]} />,
    );

    const segment = container.firstElementChild?.firstElementChild;

    expect(segment).not.toBeNull();
    expect(segment).toHaveClass("bg-primary");
    expect(segment).not.toHaveClass("ring-2");
  });
});
