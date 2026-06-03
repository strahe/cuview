import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AlertMute } from "@/types/alert";
import { muteColumns } from "./index";

const baseMute: AlertMute = {
  ID: 7,
  AlertName: "WindowPost",
  Pattern: null,
  Reason: "maintenance",
  MutedBy: "cuview",
  MutedAt: "2026-06-03T00:00:00Z",
  ExpiresAt: null,
  Active: true,
};

function renderMuteActions(mute: AlertMute, meta: Record<string, unknown>) {
  const actionsColumn = muteColumns.find((column) => column.id === "actions");
  if (!actionsColumn || typeof actionsColumn.cell !== "function") {
    throw new Error("Missing mute actions column");
  }

  render(
    actionsColumn.cell({
      row: { original: mute },
      table: { options: { meta } },
    } as never),
  );
}

describe("alert mute actions", () => {
  it("deactivates active mute rules", async () => {
    const user = userEvent.setup();
    const meta = {
      onReactivate: vi.fn(),
      onDeactivate: vi.fn(),
      onDelete: vi.fn(),
    };

    renderMuteActions(baseMute, meta);
    await user.click(
      screen.getByRole("button", { name: "Deactivate mute rule" }),
    );

    expect(meta.onDeactivate).toHaveBeenCalledWith(7);
    expect(meta.onDelete).not.toHaveBeenCalled();
    expect(meta.onReactivate).not.toHaveBeenCalled();
  });

  it("deletes inactive mute rules", async () => {
    const user = userEvent.setup();
    const meta = {
      onReactivate: vi.fn(),
      onDeactivate: vi.fn(),
      onDelete: vi.fn(),
    };

    renderMuteActions({ ...baseMute, Active: false }, meta);
    await user.click(screen.getByRole("button", { name: "Delete mute rule" }));

    expect(meta.onDelete).toHaveBeenCalledWith(7);
    expect(meta.onDeactivate).not.toHaveBeenCalled();
  });
});
