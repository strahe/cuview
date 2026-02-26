import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorOverlayProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorOverlay({
  message = "Something went wrong",
  onRetry,
}: ErrorOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <AlertCircle className="size-10 text-destructive" />
      <div>
        <p className="font-medium">Error</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Retry
        </Button>
      )}
    </div>
  );
}
