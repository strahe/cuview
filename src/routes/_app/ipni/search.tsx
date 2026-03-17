import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdDetailCard } from "./-components/ad-detail-card";
import { EntryDetailCard } from "./-components/entry-detail-card";
import { EntryScanGrid } from "./-components/entry-scan-grid";
import { useGetAd, useIpniEntry, useIpniSetSkip } from "./-module/queries";

interface IpniSearchParams {
  cid?: string;
  entryCid?: string;
}

function normalizeSearch(search: Record<string, unknown>): IpniSearchParams {
  const cid = typeof search.cid === "string" ? search.cid : undefined;
  const entryCid =
    typeof search.entryCid === "string" ? search.entryCid : undefined;

  if (cid && entryCid) {
    return { cid };
  }

  return {
    cid,
    entryCid,
  };
}

export const Route = createFileRoute("/_app/ipni/search")({
  validateSearch: normalizeSearch,
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [inputCid, setInputCid] = useState(search.cid ?? "");
  const [showScanGrid, setShowScanGrid] = useState(false);
  const [entryCid, setEntryCid] = useState(search.entryCid ?? "");

  const activeCid = search.cid ?? null;
  const activeEntryCid = search.entryCid ?? null;

  const {
    data: adDetail,
    error: adError,
    isError: isAdError,
    isLoading: adLoading,
  } = useGetAd(activeCid);
  const {
    data: entryInfo,
    error: entryError,
    isError: isEntryError,
    isLoading: entryLoading,
  } = useIpniEntry(activeEntryCid);
  const setSkipMutation = useIpniSetSkip();

  useEffect(() => {
    setInputCid(search.cid ?? "");
    setShowScanGrid(false);
  }, [search.cid]);

  useEffect(() => {
    setEntryCid(search.entryCid ?? "");
  }, [search.entryCid]);

  const doSearch = useCallback(
    (cid: string) => {
      const trimmed = cid.trim();
      if (!trimmed) return;

      setShowScanGrid(false);
      navigate({
        search: {
          cid: trimmed,
          entryCid: undefined,
        },
      });
    },
    [navigate],
  );

  const handleAdSearch = useCallback(() => {
    doSearch(inputCid);
  }, [doSearch, inputCid]);

  const handleSearchAd = useCallback(
    (cid: string) => {
      setInputCid(cid);
      doSearch(cid);
    },
    [doSearch],
  );

  const handleToggleSkip = useCallback(
    (adCid: string, skip: boolean) => {
      setSkipMutation.mutate([adCid, skip]);
    },
    [setSkipMutation],
  );

  const handleEntrySearch = useCallback(() => {
    const trimmed = entryCid.trim();
    if (!trimmed) return;

    navigate({
      search: {
        cid: undefined,
        entryCid: trimmed,
      },
    });
  }, [entryCid, navigate]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Advertisement Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Ad CID or Entry CID (bafy...)"
              value={inputCid}
              onChange={(e) => setInputCid(e.target.value)}
              className="max-w-lg font-mono text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleAdSearch()}
            />
            <Button
              size="sm"
              onClick={handleAdSearch}
              disabled={adLoading || !inputCid.trim()}
            >
              <Search className="mr-1 size-4" />
              {adLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAdError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Advertisement lookup failed</AlertTitle>
          <AlertDescription>
            {adError instanceof Error ? adError.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      )}

      {adDetail && (
        <AdDetailCard
          ad={adDetail}
          onToggleSkip={handleToggleSkip}
          skipPending={setSkipMutation.isPending}
          onSearchAd={handleSearchAd}
          onScanEntries={() => setShowScanGrid(true)}
        />
      )}

      {showScanGrid && adDetail?.entries && adDetail.entry_count > 0 && (
        <EntryScanGrid
          entriesHead={adDetail.entries}
          entryCount={adDetail.entry_count}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Entry Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter entry block CID (bafy...)"
              value={entryCid}
              onChange={(e) => setEntryCid(e.target.value)}
              className="max-w-lg font-mono text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleEntrySearch()}
            />
            <Button
              size="sm"
              onClick={handleEntrySearch}
              disabled={entryLoading || !entryCid.trim()}
            >
              <Search className="mr-1 size-4" />
              {entryLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isEntryError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Entry lookup failed</AlertTitle>
          <AlertDescription>
            {entryError instanceof Error ? entryError.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      )}

      {entryInfo && <EntryDetailCard entry={entryInfo} />}
    </div>
  );
}
