import { Check, Copy } from "lucide-react";
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
          <button
            type="button"
            aria-label={copied ? "Copied value" : "Copy value"}
            className={`inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground ${className ?? ""}`}
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
