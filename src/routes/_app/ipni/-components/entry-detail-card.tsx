import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IpniEntryInfo } from "@/types/ipni";

interface EntryDetailCardProps {
  entry: IpniEntryInfo;
}

function resolveCid(
  val: string | null | undefined | { "/": string },
): string | null {
  if (!val) return null;
  if (typeof val === "object" && "/" in val) return val["/"];
  return val;
}

export function EntryDetailCard({ entry }: EntryDetailCardProps) {
  const firstCid = resolveCid(entry.FirstCID);
  const prevCid = resolveCid(entry.PrevCID);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entry Detail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="col-span-full">
            <div className="text-muted-foreground">Piece CID</div>
            <div className="font-mono text-xs break-all">{entry.PieceCID}</div>
          </div>

          <div>
            <div className="text-muted-foreground">From CAR</div>
            <div>{entry.FromCar ? "Yes" : "No"}</div>
          </div>

          <div>
            <div className="text-muted-foreground">Num Blocks</div>
            <div>{entry.NumBlocks}</div>
          </div>

          <div>
            <div className="text-muted-foreground">Size</div>
            <div>{entry.Size}</div>
          </div>

          {entry.StartOffset != null && (
            <div>
              <div className="text-muted-foreground">Start Offset</div>
              <div>{entry.StartOffset}</div>
            </div>
          )}

          {firstCid && (
            <div className="col-span-full">
              <div className="text-muted-foreground">First CID</div>
              <div className="font-mono text-xs break-all">{firstCid}</div>
            </div>
          )}

          {prevCid && (
            <div className="col-span-full">
              <div className="text-muted-foreground">Previous CID</div>
              <div className="font-mono text-xs break-all">{prevCid}</div>
            </div>
          )}

          {entry.Err && (
            <div className="col-span-full">
              <div className="text-muted-foreground">Error</div>
              <div className="text-destructive">{entry.Err}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
