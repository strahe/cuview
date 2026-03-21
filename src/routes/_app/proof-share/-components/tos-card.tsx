import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PsTos } from "../-module/types";

interface TosCardProps {
  tos: PsTos;
}

export function TosCard({ tos }: TosCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms of Service</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-1 text-sm font-medium">Provider ToS</h4>
            <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
              {tos.provider}
            </pre>
          </div>
          <div>
            <h4 className="mb-1 text-sm font-medium">Client ToS</h4>
            <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
              {tos.client}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
