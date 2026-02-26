import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { setStoredEndpoint } from "@/contexts/curio-api-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});

type TestStatus = "idle" | "testing" | "success" | "error";

function SetupPage() {
  const navigate = useNavigate();
  const [endpoint, setEndpoint] = useState("ws://localhost:4701/api/webrpc/v0");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const testConnection = useCallback(async () => {
    setTestStatus("testing");
    setErrorMessage("");

    try {
      const ws = new WebSocket(endpoint);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error("Connection timeout"));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve();
        };
        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Connection failed"));
        };
      });

      setTestStatus("success");
    } catch (err) {
      setTestStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Connection failed");
    }
  }, [endpoint]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setStoredEndpoint(endpoint);
      navigate({ to: "/overview" });
    },
    [endpoint, navigate],
  );

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
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-card p-6"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="endpoint"
                className="mb-1.5 block text-sm font-medium"
              >
                Curio Endpoint
              </label>
              <input
                id="endpoint"
                type="text"
                value={endpoint}
                onChange={(e) => {
                  setEndpoint(e.target.value);
                  setTestStatus("idle");
                }}
                placeholder="ws://localhost:4701/api/webrpc/v0"
                className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={testConnection}
                disabled={!endpoint.trim() || testStatus === "testing"}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition",
                  "hover:bg-accent disabled:opacity-50",
                )}
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
                Test Connection
              </button>

              <button
                type="submit"
                disabled={!endpoint.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50"
              >
                Connect
                <ArrowRight className="size-4" />
              </button>
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
