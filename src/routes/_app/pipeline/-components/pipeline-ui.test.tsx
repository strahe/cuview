import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PorepSectorView, SnapSectorView } from "../-module/types";
import { createPorepColumns, type PorepColumnMeta } from "./porep-columns";
import { RestartConfirmButton } from "./restart-confirm-button";
import { type SnapColumnMeta, snapSectorColumns } from "./snap-columns";

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    type = "button",
    variant,
    size,
    ...props
  }: ComponentProps<"button"> & {
    variant?: string;
    size?: string;
  }) => (
    <button type={type} data-size={size} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

const porepRow: PorepSectorView = {
  spId: 1234,
  sectorNumber: 42,
  address: "f01234",
  createTime: "2026-03-08 10:00:00",
  stage: "Pending",
  isRunning: false,
  activeTaskId: null,
  failed: false,
  failedReason: "",
  chainAlloc: false,
  chainSector: false,
  chainActive: false,
  chainUnproven: false,
  chainFaulty: false,
  preCommitMsgCid: null,
  commitMsgCid: null,
  seedEpoch: null,
  runningStages: [],
  raw: {} as never,
};

const snapRow: SnapSectorView = {
  spId: 2345,
  sectorNumber: 99,
  address: "f02345",
  startTime: "2026-03-08 10:05:00",
  stage: "Pending",
  activeTaskId: null,
  failed: false,
  failedReason: "",
  failedReasonMsg: "",
  updateReadyAt: null,
  raw: {} as never,
};

function renderPorepActions(meta: PorepColumnMeta) {
  const actionsColumn = createPorepColumns().find(
    (column) => column.id === "actions",
  );

  if (!actionsColumn || typeof actionsColumn.cell !== "function") {
    throw new Error("PoRep actions column is unavailable");
  }

  const cell = actionsColumn.cell as (context: {
    row: { original: PorepSectorView };
    table: { options: { meta: PorepColumnMeta } };
  }) => ReactNode;

  render(
    cell({
      row: { original: porepRow },
      table: { options: { meta } },
    }),
  );
}

function renderSnapActions(meta: SnapColumnMeta) {
  const actionsColumn = snapSectorColumns.find(
    (column) => column.id === "actions",
  );

  if (!actionsColumn || typeof actionsColumn.cell !== "function") {
    throw new Error("Snap actions column is unavailable");
  }

  const cell = actionsColumn.cell as (context: {
    row: { original: SnapSectorView };
    table: { options: { meta: SnapColumnMeta } };
  }) => ReactNode;

  render(
    cell({
      row: { original: snapRow },
      table: { options: { meta } },
    }),
  );
}

describe("pipeline action UI", () => {
  it("renders PoRep row actions with ghost icon buttons", () => {
    const onAction = vi.fn();

    renderPorepActions({ onAction });

    const resumeButton = screen.getByTitle("Resume sector");
    const restartButton = screen.getByTitle("Restart sector");
    const removeButton = screen.getByTitle("Remove sector");

    expect(resumeButton).toHaveAttribute("data-variant", "ghost");
    expect(resumeButton).toHaveAttribute("data-size", "icon-xs");
    expect(restartButton).toHaveAttribute("data-variant", "ghost");
    expect(restartButton).toHaveAttribute("data-size", "icon-xs");
    expect(removeButton).toHaveAttribute("data-variant", "ghost");
    expect(removeButton).toHaveAttribute("data-size", "icon-xs");

    fireEvent.click(resumeButton);
    fireEvent.click(restartButton);
    fireEvent.click(removeButton);

    expect(onAction).toHaveBeenNthCalledWith(1, 1234, 42, "resume");
    expect(onAction).toHaveBeenNthCalledWith(2, 1234, 42, "restart");
    expect(onAction).toHaveBeenNthCalledWith(3, 1234, 42, "remove");
  });

  it("renders Snap row actions with ghost icon buttons", () => {
    const onDelete = vi.fn();
    const onResetTasks = vi.fn();

    renderSnapActions({ onDelete, onResetTasks });

    const resetButton = screen.getByTitle("Reset task IDs");
    const deleteButton = screen.getByTitle("Delete upgrade");

    expect(resetButton).toHaveAttribute("data-variant", "ghost");
    expect(resetButton).toHaveAttribute("data-size", "icon-xs");
    expect(deleteButton).toHaveAttribute("data-variant", "ghost");
    expect(deleteButton).toHaveAttribute("data-size", "icon-xs");

    fireEvent.click(resetButton);
    fireEvent.click(deleteButton);

    expect(onResetTasks).toHaveBeenCalledWith(2345, 99);
    expect(onDelete).toHaveBeenCalledWith(2345, 99);
  });

  it("disables the restart trigger while a restart mutation is pending", () => {
    const onConfirm = vi.fn();
    const confirmMessage = "Restart all failed tasks?";

    const { rerender } = render(
      <RestartConfirmButton
        label="Restart All Failed"
        confirmMessage={confirmMessage}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Restart All Failed" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);

    rerender(
      <RestartConfirmButton
        label="Restart All Failed"
        confirmMessage={confirmMessage}
        onConfirm={onConfirm}
        isPending
      />,
    );

    expect(
      screen.getByRole("button", { name: "Restart All Failed" }),
    ).toBeDisabled();
  });
});
