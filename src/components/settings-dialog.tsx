import { useForm } from "@tanstack/react-form";
import { useCallback, useState } from "react";
import {
  AppField,
  getFormFieldErrors,
  isFormFieldInvalid,
} from "@/components/composed/form";
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

interface SettingsDialogEndpointFormProps {
  currentEndpointValue: string;
  onFieldChange: () => void;
  onSubmit: (endpoint: string) => void;
  switchStatus: SwitchStatus;
}

function SettingsDialogEndpointForm({
  currentEndpointValue,
  onFieldChange,
  onSubmit,
  switchStatus,
}: SettingsDialogEndpointFormProps) {
  const form = useForm({
    defaultValues: {
      endpoint: currentEndpointValue,
    },
    onSubmit: ({ value }) => {
      onSubmit(value.endpoint);
    },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="endpoint"
        validators={{
          onChange: ({ value }) =>
            value.trim() ? undefined : "RPC endpoint is required.",
        }}
      >
        {(field) => (
          <AppField
            errors={
              isFormFieldInvalid(field) ? getFormFieldErrors(field) : undefined
            }
            htmlFor="settings-rpc-endpoint"
            label="RPC Endpoint"
            required
          >
            <div className="flex gap-2">
              <Input
                id="settings-rpc-endpoint"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                  onFieldChange();
                }}
                placeholder="http://localhost:4701"
                value={field.state.value}
              />
              <form.Subscribe selector={(state) => state.values.endpoint}>
                {(endpointValue) => (
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={
                      !endpointValue.trim() || switchStatus === "testing"
                    }
                  >
                    {switchStatus === "testing"
                      ? "Switching..."
                      : "Test & Switch"}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </AppField>
        )}
      </form.Field>
    </form>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { endpoint, endpointHistory, testAndSwitchEndpoint } =
    useCurioConnection();
  const currentEndpointValue = formatEndpointForDisplay(endpoint);
  const [switchStatus, setSwitchStatus] = useState<SwitchStatus>("idle");
  const [switchMessage, setSwitchMessage] = useState("");

  const runSwitchFlow = useCallback(
    async (rawEndpoint: string) => {
      setSwitchStatus("testing");
      setSwitchMessage("");

      const result = await testAndSwitchEndpoint(rawEndpoint);
      if (result.ok) {
        setSwitchStatus("success");
        setSwitchMessage("Switched successfully.");
        return;
      }

      setSwitchStatus("error");
      setSwitchMessage(result.error);
    },
    [testAndSwitchEndpoint],
  );

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

        {open ? (
          <SettingsDialogEndpointForm
            key={currentEndpointValue}
            currentEndpointValue={currentEndpointValue}
            onFieldChange={() => {
              setSwitchStatus("idle");
              setSwitchMessage("");
            }}
            onSubmit={(rawEndpoint) => {
              void runSwitchFlow(rawEndpoint);
            }}
            switchStatus={switchStatus}
          />
        ) : null}

        <div className="space-y-3">
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
