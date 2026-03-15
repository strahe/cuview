import type { Deadline } from "@/types/actor";
import { getDeadlineColor, getDeadlineStatus } from "../-module/adapters";

export function DeadlineMiniBar({ deadlines }: { deadlines: Deadline[] }) {
  if (!deadlines?.length) return null;

  return (
    <div
      className="flex gap-px"
      title="48 deadlines: green=proven, blue=current, red=faulty"
    >
      {deadlines.map((d, i) => {
        const status = getDeadlineStatus(d);
        const color =
          status === "current"
            ? "bg-primary ring-1 ring-inset ring-primary/50"
            : getDeadlineColor(status);

        return (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm ${color}`}
            title={`Deadline ${i}${d.Current ? " (current)" : ""}${d.Faulty ? " (faulty)" : ""}${d.Proven ? " (proven)" : ""}`}
          />
        );
      })}
    </div>
  );
}
