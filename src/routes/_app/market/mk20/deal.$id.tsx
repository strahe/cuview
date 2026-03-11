import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMK20DealDetail } from "../-module/queries";
import { extractNullable } from "../-module/types";

export const Route = createFileRoute("/_app/market/mk20/deal/$id")({
  component: MK20DealDetailPage,
});

function formatValue(val: unknown): string {
  if (val == null) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "string") return val || "—";
  if (typeof val === "number") return String(val);
  if (typeof val === "object" && "Valid" in (val as Record<string, unknown>)) {
    return extractNullable(val as { Valid: boolean }) ?? "—";
  }
  return JSON.stringify(val);
}

function MK20DealDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading, isError } = useMK20DealDetail(id);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        Loading deal {id.slice(0, 8)}…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 py-8">
        <p className="text-destructive">
          Deal not found or failed to load: {id}
        </p>
        <Link
          to="/market/mk20/deals"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-3" /> Back to MK20 Deals
        </Link>
      </div>
    );
  }

  const ddoid = extractNullable(data.ddoid as { Valid: boolean } | null);
  const ddoerr = extractNullable(data.ddoerr as { Valid: boolean } | null);
  const pdperr = extractNullable(data.pdperr as { Valid: boolean } | null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/market/mk20/deals"
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back
        </Link>
        <h2 className="font-mono text-sm font-semibold">{id}</h2>
        {ddoid && (
          <span className="text-xs text-muted-foreground">DDO ID: {ddoid}</span>
        )}
      </div>

      {data.deal && Object.keys(data.deal).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Deal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
              {Object.entries(data.deal).map(([key, val]) => (
                <div key={key}>
                  <span className="text-muted-foreground">{key}</span>
                  <div className="truncate font-mono text-xs">
                    {formatValue(val)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {ddoerr && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-destructive">
              DDO Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-destructive">
              {ddoerr}
            </p>
          </CardContent>
        </Card>
      )}

      {pdperr && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-destructive">
              PDP Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-destructive">
              {pdperr}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
