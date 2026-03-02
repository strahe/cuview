import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCurioConnection } from "@/contexts/curio-api-context";
import { formatEndpointForDisplay } from "@/utils/endpoint";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SwitchStatus = "idle" | "testing" | "success" | "error";

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { endpoint, endpointHistory, testAndSwitchEndpoint } =
    useCurioConnection();

  const [endpointInput, setEndpointInput] = useState(
    formatEndpointForDisplay(endpoint),
  );
  const [switchStatus, setSwitchStatus] = useState<SwitchStatus>("idle");
  const [switchMessage, setSwitchMessage] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setEndpointInput(formatEndpointForDisplay(endpoint));
  }, [endpoint, open]);

  const runSwitchFlow = useCallback(
    async (rawEndpoint: string) => {
      setSwitchStatus("testing");
      setSwitchMessage("");

      const result = await testAndSwitchEndpoint(rawEndpoint);
      if (result.ok) {
        setSwitchStatus("success");
        setSwitchMessage("Switched successfully.");
        setEndpointInput(formatEndpointForDisplay(result.endpoint));
        return;
      }

      setSwitchStatus("error");
      setSwitchMessage(result.error);
    },
    [testAndSwitchEndpoint],
  );

  const handleSwitchSubmit = useCallback(() => {
    void runSwitchFlow(endpointInput);
  }, [endpointInput, runSwitchFlow]);

  const handleHistorySwitch = useCallback(
    (historyEndpoint: string) => {
      void runSwitchFlow(historyEndpoint);
    },
    [runSwitchFlow],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <label
            htmlFor="settings-rpc-endpoint"
            className="text-sm font-medium"
          >
            RPC Endpoint
          </label>
          <div className="flex gap-2">
            <Input
              id="settings-rpc-endpoint"
              value={endpointInput}
              onChange={(event) => {
                setEndpointInput(event.target.value);
                setSwitchStatus("idle");
                setSwitchMessage("");
              }}
              placeholder="http://localhost:4701"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSwitchSubmit}
              disabled={!endpointInput.trim() || switchStatus === "testing"}
            >
              {switchStatus === "testing" ? "Switching..." : "Test & Switch"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Current endpoint: {formatEndpointForDisplay(endpoint)}
          </div>

          {switchStatus === "error" && switchMessage && (
            <p className="text-sm text-destructive">{switchMessage}</p>
          )}
          {switchStatus === "success" && switchMessage && (
            <p className="text-sm text-success">{switchMessage}</p>
          )}

          {endpointHistory.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Recent endpoints
              </div>
              <div className="flex flex-wrap gap-2">
                {endpointHistory.map((historyEndpoint) => {
                  const label = formatEndpointForDisplay(historyEndpoint);

                  return (
                    <Button
                      key={historyEndpoint}
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => handleHistorySwitch(historyEndpoint)}
                      disabled={switchStatus === "testing"}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
