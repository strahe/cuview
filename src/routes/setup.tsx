import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import {
  AppField,
  getFormFieldErrors,
  isFormFieldInvalid,
} from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurioConnection } from "@/contexts/curio-api-context";
import { formatEndpointForDisplay } from "@/utils/endpoint";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});

type TestStatus = "idle" | "testing" | "success" | "error";

export function SetupPage() {
  const navigate = useNavigate();
  const { endpoint: activeEndpoint, testAndSwitchEndpoint } =
    useCurioConnection();
  const activeEndpointValue =
    formatEndpointForDisplay(activeEndpoint) || "http://localhost:4701";

  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const form = useForm({
    defaultValues: {
      endpoint: activeEndpointValue,
    },
    onSubmit: ({ value }) => {
      void runConnectionFlow(value.endpoint, true);
    },
  });

  const runConnectionFlow = async (
    rawEndpoint: string,
    navigateOnSuccess: boolean,
  ) => {
    setTestStatus("testing");
    setErrorMessage("");

    const result = await testAndSwitchEndpoint(rawEndpoint);

    if (result.ok) {
      setTestStatus("success");
      form.reset({
        endpoint: formatEndpointForDisplay(result.endpoint),
      });

      if (navigateOnSuccess) {
        navigate({ to: "/overview" });
      }
      return;
    }

    setTestStatus("error");
    setErrorMessage(result.error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-4 grid size-14 place-items-center rounded-2xl text-xl font-bold">
            C
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to Cuview
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Configure your Curio endpoint to get started.
          </p>
        </div>

        <form
          className="rounded-lg border border-border bg-card p-6"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="space-y-4">
            <form.Field
              name="endpoint"
              validators={{
                onChange: ({ value }) =>
                  value.trim() ? undefined : "Curio endpoint is required.",
              }}
            >
              {(field) => (
                <AppField
                  errors={
                    isFormFieldInvalid(field)
                      ? getFormFieldErrors(field)
                      : undefined
                  }
                  htmlFor="endpoint"
                  label="Curio Endpoint"
                  required
                >
                  <Input
                    id="endpoint"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                      setTestStatus("idle");
                      setErrorMessage("");
                    }}
                    placeholder="http://localhost:4701"
                    type="text"
                    value={field.state.value}
                  />
                </AppField>
              )}
            </form.Field>

            <div className="flex gap-2">
              <form.Subscribe selector={(state) => state.values.endpoint}>
                {(endpointValue) => (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void runConnectionFlow(endpointValue, false);
                      }}
                      disabled={
                        !endpointValue.trim() || testStatus === "testing"
                      }
                      className="flex items-center gap-2"
                    >
                      {testStatus === "testing" && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {testStatus === "success" && (
                        <CheckCircle2 className="size-4 text-success" />
                      )}
                      {testStatus === "error" && (
                        <XCircle className="size-4 text-destructive" />
                      )}
                      {testStatus === "testing"
                        ? "Testing..."
                        : "Test Connection"}
                    </Button>

                    <Button
                      type="submit"
                      disabled={
                        !endpointValue.trim() || testStatus === "testing"
                      }
                      className="flex flex-1 items-center justify-center gap-2"
                    >
                      Connect
                      <ArrowRight className="size-4" />
                    </Button>
                  </>
                )}
              </form.Subscribe>
            </div>

            {testStatus === "error" && errorMessage && (
              <p className="text-destructive text-sm">{errorMessage}</p>
            )}
            {testStatus === "success" && (
              <p className="text-success text-sm">Connection successful!</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
