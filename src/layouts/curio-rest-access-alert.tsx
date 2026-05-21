import { AlertCircle, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useState } from "react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { formatCurioCorsOriginsValue } from "@/utils/curio-rest-access";

export function CurioRestAccessAlert() {
  const [showDetails, setShowDetails] = useState(false);
  const { copied, copy } = useCopyToClipboard();
  const corsOriginsValue = formatCurioCorsOriginsValue();

  return (
    <Alert variant="destructive" className="border-destructive/40 bg-card">
      <AlertCircle />
      <AlertTitle>Cuview blocked by Curio CORS</AlertTitle>
      <AlertAction>
        <Button
          type="button"
          variant="outline"
          size="xs"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((visible) => !visible)}
        >
          {showDetails ? (
            <ChevronUp data-icon="inline-start" />
          ) : (
            <ChevronDown data-icon="inline-start" />
          )}
          {showDetails ? "Hide fix" : "Show fix"}
        </Button>
      </AlertAction>
      {showDetails && (
        <AlertDescription className="mt-3">
          <div className="flex flex-col gap-3 text-foreground">
            <Separator />
            <div className="flex flex-col gap-2">
              <div>
                Add these origins to{" "}
                <code className="font-mono text-foreground">
                  HTTP.CORSOrigins
                </code>{" "}
                in the Curio GUI layer, then restart the Curio GUI node.
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-mono text-xs text-muted-foreground">
                    HTTP.CORSOrigins
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      void copy(corsOriginsValue);
                    }}
                  >
                    <Copy data-icon="inline-start" />
                    {copied ? "Copied" : "Copy origins"}
                  </Button>
                </div>
                <pre className="w-fit max-w-full overflow-x-auto rounded bg-muted/30 px-3 py-2 font-mono text-xs text-foreground">
                  {corsOriginsValue}
                </pre>
              </div>
            </div>
          </div>
        </AlertDescription>
      )}
    </Alert>
  );
}
