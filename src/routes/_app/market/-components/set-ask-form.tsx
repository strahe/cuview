import { Edit2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { StorageAsk } from "@/types/market";
import { useSetStorageAsk } from "../-module/queries";

const DEFAULT_MIN_SIZE = 4 * 1024 ** 3; // 4 GiB
const DEFAULT_MAX_SIZE = 32 * 1024 ** 3; // 32 GiB

interface SetAskFormProps {
  currentAsk?: StorageAsk;
}

export function SetAskForm({ currentAsk }: SetAskFormProps) {
  const [miner, setMiner] = useState(currentAsk?.Miner ?? "");
  const [prevMinerProp, setPrevMinerProp] = useState(currentAsk?.Miner);

  if (currentAsk?.Miner !== prevMinerProp) {
    setPrevMinerProp(currentAsk?.Miner);
    if (currentAsk?.Miner) {
      setMiner(currentAsk.Miner);
    }
  }

  const [price, setPrice] = useState(
    currentAsk?.Price != null ? String(currentAsk.Price) : "0",
  );
  const [verifiedPrice, setVerifiedPrice] = useState(
    currentAsk?.VerifiedPrice != null ? String(currentAsk.VerifiedPrice) : "0",
  );
  const [minSize, setMinSize] = useState(
    currentAsk?.MinSize != null
      ? String(currentAsk.MinSize)
      : String(DEFAULT_MIN_SIZE),
  );
  const [maxSize, setMaxSize] = useState(
    currentAsk?.MaxSize != null
      ? String(currentAsk.MaxSize)
      : String(DEFAULT_MAX_SIZE),
  );

  // Sync form values when currentAsk changes
  const [prevAsk, setPrevAsk] = useState(currentAsk);
  if (currentAsk !== prevAsk) {
    setPrevAsk(currentAsk);
    if (currentAsk) {
      setPrice(String(currentAsk.Price));
      setVerifiedPrice(String(currentAsk.VerifiedPrice));
      setMinSize(String(currentAsk.MinSize));
      setMaxSize(String(currentAsk.MaxSize));
    }
  }

  const mutation = useSetStorageAsk();

  const handleSubmit = () => {
    if (!miner) return;
    const spID = Number.parseInt(miner.replace(/^[ftFT]0*/, ""), 10);
    if (Number.isNaN(spID)) return;
    const now = Math.floor(Date.now() / 1000);
    mutation.mutate([
      {
        SpID: spID,
        Price: Number(price) || 0,
        VerifiedPrice: Number(verifiedPrice) || 0,
        MinSize: Number(minSize) || DEFAULT_MIN_SIZE,
        MaxSize: Number(maxSize) || DEFAULT_MAX_SIZE,
        CreatedAt: now,
        Expiry: now + 365 * 24 * 60 * 60,
      },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Edit2 className="size-4" /> Set Storage Ask
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Miner</label>
            <Input
              placeholder="f0..."
              value={miner}
              onChange={(e) => setMiner(e.target.value)}
              className="w-32 font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Price (attoFIL/GiB/Epoch)
            </label>
            <Input
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-28"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Verified Price (attoFIL/GiB/Epoch)
            </label>
            <Input
              placeholder="0"
              value={verifiedPrice}
              onChange={(e) => setVerifiedPrice(e.target.value)}
              className="w-28"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Min Size (bytes)
            </label>
            <Input
              placeholder={String(DEFAULT_MIN_SIZE)}
              value={minSize}
              onChange={(e) => setMinSize(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Max Size (bytes)
            </label>
            <Input
              placeholder={String(DEFAULT_MAX_SIZE)}
              value={maxSize}
              onChange={(e) => setMaxSize(e.target.value)}
              className="w-32"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Set Ask"}
          </Button>
        </div>
        {mutation.isError && (
          <p className="mt-2 text-xs text-destructive">
            {(mutation.error as Error)?.message ?? "Failed to set ask"}
          </p>
        )}
        {mutation.isSuccess && (
          <p className="mt-2 text-xs text-success">Ask updated</p>
        )}
      </CardContent>
    </Card>
  );
}
