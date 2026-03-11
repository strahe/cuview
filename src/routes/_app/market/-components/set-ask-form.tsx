import { Edit2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { StorageAsk } from "@/types/market";
import { useSetStorageAsk } from "../-module/queries";

interface SetAskFormProps {
  currentAsk?: StorageAsk;
}

export function SetAskForm({ currentAsk }: SetAskFormProps) {
  const [miner, setMiner] = useState(currentAsk?.Miner ?? "");

  useEffect(() => {
    if (currentAsk?.Miner) setMiner(currentAsk.Miner);
  }, [currentAsk?.Miner]);
  const [price, setPrice] = useState("");
  const [verifiedPrice, setVerifiedPrice] = useState("");
  const [minSize, setMinSize] = useState("");
  const [maxSize, setMaxSize] = useState("");

  const mutation = useSetStorageAsk();

  const handleSubmit = () => {
    if (!miner) return;
    mutation.mutate([miner, price, verifiedPrice, minSize, maxSize]);
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
            <label className="text-xs text-muted-foreground">Price</label>
            <Input
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-28"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Verified Price
            </label>
            <Input
              placeholder="0"
              value={verifiedPrice}
              onChange={(e) => setVerifiedPrice(e.target.value)}
              className="w-28"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Min Size</label>
            <Input
              placeholder="256B"
              value={minSize}
              onChange={(e) => setMinSize(e.target.value)}
              className="w-24"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Max Size</label>
            <Input
              placeholder="32GiB"
              value={maxSize}
              onChange={(e) => setMaxSize(e.target.value)}
              className="w-24"
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
