import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Deadline } from "@/types/actor";
import {
  formatDeadlineTooltip,
  getDeadlineColor,
  getDeadlineStatus,
} from "../-module/adapters";

export function DeadlineGrid({ deadlines }: { deadlines: Deadline[] }) {
  if (!deadlines.length) {
    return <p className="text-sm text-muted-foreground">No deadline data</p>;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-16 gap-1">
        {deadlines.map((d, i) => {
          const status = getDeadlineStatus(d);
          const color = getDeadlineColor(status);
          const tooltipText = formatDeadlineTooltip(d, i);

          return (
            <Tooltip key={i}>
              <TooltipTrigger
                render={
                  <div className={`h-5 rounded-sm ${color} cursor-default`} />
                }
              />
              <TooltipContent
                side="top"
                className="max-w-xs whitespace-pre-line text-xs"
              >
                {tooltipText}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <DeadlineLegend />
    </div>
  );
}

function DeadlineLegend() {
  const items = [
    { color: "bg-success", label: "Proven" },
    { color: "bg-primary", label: "Current" },
    { color: "bg-destructive animate-pulse", label: "Danger" },
    { color: "bg-warning", label: "Part Faulty" },
    { color: "bg-destructive", label: "Faulty" },
    { color: "bg-primary/40", label: "Pending" },
    { color: "bg-muted", label: "Empty" },
  ];

  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <div className={`size-2.5 rounded-sm ${item.color}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
