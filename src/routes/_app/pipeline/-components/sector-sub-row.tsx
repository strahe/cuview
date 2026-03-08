import type { PorepSectorView } from "../-module/types";

export function SectorSubRow({ row }: { row: PorepSectorView }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1 px-8 py-3 text-xs sm:grid-cols-3">
      <div>
        <span className="text-muted-foreground">PreCommit Msg:</span>{" "}
        <span className="font-mono">
          {row.preCommitMsgCid?.slice(0, 16) || "—"}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Commit Msg:</span>{" "}
        <span className="font-mono">
          {row.commitMsgCid?.slice(0, 16) || "—"}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Seed Epoch:</span>{" "}
        {row.seedEpoch ?? "—"}
      </div>
      {row.runningStages.length > 0 && (
        <div>
          <span className="text-muted-foreground">Running:</span>{" "}
          {row.runningStages.join(", ")}
        </div>
      )}
    </div>
  );
}
