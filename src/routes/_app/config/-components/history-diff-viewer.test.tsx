import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoryDiffViewer } from "./history-diff-viewer";

describe("HistoryDiffViewer", () => {
  it("shows the no-differences state for identical content", () => {
    render(<HistoryDiffViewer oldContent="same" newContent="same" />);

    expect(screen.getByText("No differences.")).toBeInTheDocument();
  });
});
