import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

export function CopyButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            aria-label={copied ? "Copied value" : "Copy value"}
            className={className}
            size="icon-xs"
            variant="ghost"
          />
        }
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void copy(value);
        }}
      >
        {copied ? (
          <Check className="size-3 text-success" />
        ) : (
          <Copy className="size-3" />
        )}
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>
    </Tooltip>
  );
}
