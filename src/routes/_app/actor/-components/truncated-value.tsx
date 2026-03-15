import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TruncatedValue({
  value,
  className = "max-w-48",
}: {
  value: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={`block cursor-default truncate font-mono text-xs ${className}`}
          />
        }
      >
        {value}
      </TooltipTrigger>
      <TooltipContent className="max-w-sm break-all font-mono text-xs">
        {value}
      </TooltipContent>
    </Tooltip>
  );
}
