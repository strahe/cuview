import { createFileRoute } from "@tanstack/react-router";
import {
  HardDrive,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import { StatusBadge } from "@/components/composed/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";

export const Route = createFileRoute("/_app/sectors/diagnostics/")({
  component: DiagnosticsPage,
});

// --- Types ---

interface CommRCheckResult {
  check_id: number;
  sp_id: number;
  sector_number: number;
  task_id?: number;
  file_type: string;
  expected_comm_r: string;
  actual_comm_r?: string;
  ok?: boolean;
  message?: string;
  create_time?: string;
  complete: boolean;
  error?: string;
}

interface UnsealedCheckResult {
  check_id: number;
  sp_id: number;
  sector_number: number;
  task_id?: number;
  expected_commd: string;
  actual_commd?: string;
  ok?: boolean;
  message?: string;
  create_time?: string;
  complete: boolean;
  error?: string;
}

interface VanillaTestResult {
  sector_number: number;
  generate_ok: boolean;
  verify_ok: boolean;
  generate_error?: string;
  verify_error?: string;
  generate_time: string;
  verify_time?: string;
  slow: boolean;
}

interface VanillaTestReport {
  miner: string;
  deadline?: number;
  partition?: number;
  sector_count: number;
  tested_count: number;
  passed_count: number;
  failed_count: number;
  slow_count: number;
  total_time: string;
  results: VanillaTestResult[] | null;
  error?: string;
}

interface WdPostTaskResult {
  task_id: number;
  sp_id: number;
  deadline: number;
  partition: number;
  submitted: boolean;
  result?: string;
  error?: string;
}

// --- Main Page ---

function DiagnosticsPage() {
  const [activeTab, setActiveTab] = useState("commr");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="commr">
            <ShieldCheck className="mr-1 size-3.5" /> CommR Check
          </TabsTrigger>
          <TabsTrigger value="unsealed">
            <HardDrive className="mr-1 size-3.5" /> Unsealed Check
          </TabsTrigger>
          <TabsTrigger value="vanilla">
            <Zap className="mr-1 size-3.5" /> Vanilla Test
          </TabsTrigger>
          <TabsTrigger value="wdpost">
            <Play className="mr-1 size-3.5" /> WdPost Test
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {activeTab === "commr" && <CommRCheckPanel />}
          {activeTab === "unsealed" && <UnsealedCheckPanel />}
          {activeTab === "vanilla" && <VanillaTestPanel />}
          {activeTab === "wdpost" && <WdPostTestPanel />}
        </div>
      </Tabs>
    </div>
  );
}

// --- CommR Check ---

function CommRCheckPanel() {
  const [sp, setSp] = useState("");
  const [sector, setSector] = useState("");
  const [fileType, setFileType] = useState("sealed");
  const [searchSp, setSearchSp] = useState<string | null>(null);
  const [searchSector, setSearchSector] = useState<number | null>(null);

  const { data: results, isLoading: listLoading } = useCurioRpc<
    CommRCheckResult[]
  >("SectorCommRCheckList", [searchSp!, searchSector!], {
    enabled: !!searchSp && searchSector !== null,
    refetchInterval: 5000,
  });

  const startCheck = useCurioRpcMutation<CommRCheckResult>(
    "SectorCommRCheckStart",
    {
      invalidateKeys: [["curio", "SectorCommRCheckList"]],
    },
  );

  const checkStatus = useCurioRpcMutation<CommRCheckResult>(
    "SectorCommRCheckStatus",
  );

  const [statusResult, setStatusResult] = useState<CommRCheckResult | null>(
    null,
  );

  const handleSearch = useCallback(() => {
    if (sp.trim() && sector.trim()) {
      setSearchSp(sp.trim());
      setSearchSector(Number.parseInt(sector, 10));
    }
  }, [sp, sector]);

  const handleStart = useCallback(() => {
    if (sp.trim() && sector.trim()) {
      startCheck.mutate([sp.trim(), Number.parseInt(sector, 10), fileType]);
    }
  }, [sp, sector, fileType, startCheck]);

  const handleCheckStatus = useCallback(
    (checkId: number) => {
      checkStatus.mutate([checkId], {
        onSuccess: (data) => setStatusResult(data),
      });
    },
    [checkStatus],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>CommR Integrity Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              SP Address
            </label>
            <Input
              placeholder="f0..."
              value={sp}
              onChange={(e) => setSp(e.target.value)}
              className="w-40 font-mono text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Sector #
            </label>
            <Input
              placeholder="0"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-28 font-mono text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              File Type
            </label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="h-9 rounded-md border border-border bg-transparent px-2 text-xs"
            >
              <option value="sealed">Sealed</option>
              <option value="update">Update</option>
            </select>
          </div>
          <Button
            size="sm"
            onClick={handleStart}
            disabled={!sp.trim() || !sector.trim() || startCheck.isPending}
          >
            <Play className="mr-1 size-3" />
            {startCheck.isPending ? "Starting..." : "Start Check"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSearch}
            disabled={!sp.trim() || !sector.trim()}
          >
            <Search className="mr-1 size-3" /> View History
          </Button>
        </div>

        {startCheck.data && (
          <div className="rounded border border-border p-2 text-xs">
            <span className="text-muted-foreground">Check started: </span>
            ID #{startCheck.data.check_id}
          </div>
        )}

        {statusResult && <CheckResultCard result={statusResult} type="commr" />}

        {listLoading && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
        {results && results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Check History ({results.length})
            </h4>
            {results.map((r) => (
              <div
                key={r.check_id}
                className="flex items-center justify-between rounded border border-border p-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground">
                    #{r.check_id}
                  </span>
                  <span>{r.file_type}</span>
                  <CheckStatusBadge result={r} />
                  {r.create_time && (
                    <span className="text-muted-foreground">
                      {r.create_time}
                    </span>
                  )}
                </div>
                {!r.complete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCheckStatus(r.check_id)}
                  >
                    <RefreshCw className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Unsealed Check ---

function UnsealedCheckPanel() {
  const [sp, setSp] = useState("");
  const [sector, setSector] = useState("");
  const [searchSp, setSearchSp] = useState<string | null>(null);
  const [searchSector, setSearchSector] = useState<number | null>(null);

  const { data: results, isLoading: listLoading } = useCurioRpc<
    UnsealedCheckResult[]
  >("SectorUnsealedCheckList", [searchSp!, searchSector!], {
    enabled: !!searchSp && searchSector !== null,
    refetchInterval: 5000,
  });

  const startCheck = useCurioRpcMutation<UnsealedCheckResult>(
    "SectorUnsealedCheckStart",
    {
      invalidateKeys: [["curio", "SectorUnsealedCheckList"]],
    },
  );

  const checkStatus = useCurioRpcMutation<UnsealedCheckResult>(
    "SectorUnsealedCheckStatus",
  );
  const [statusResult, setStatusResult] = useState<UnsealedCheckResult | null>(
    null,
  );

  const handleSearch = useCallback(() => {
    if (sp.trim() && sector.trim()) {
      setSearchSp(sp.trim());
      setSearchSector(Number.parseInt(sector, 10));
    }
  }, [sp, sector]);

  const handleStart = useCallback(() => {
    if (sp.trim() && sector.trim()) {
      startCheck.mutate([sp.trim(), Number.parseInt(sector, 10)]);
    }
  }, [sp, sector, startCheck]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unsealed Data Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              SP Address
            </label>
            <Input
              placeholder="f0..."
              value={sp}
              onChange={(e) => setSp(e.target.value)}
              className="w-40 font-mono text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Sector #
            </label>
            <Input
              placeholder="0"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-28 font-mono text-xs"
            />
          </div>
          <Button
            size="sm"
            onClick={handleStart}
            disabled={!sp.trim() || !sector.trim() || startCheck.isPending}
          >
            <Play className="mr-1 size-3" />
            {startCheck.isPending ? "Starting..." : "Start Check"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSearch}
            disabled={!sp.trim() || !sector.trim()}
          >
            <Search className="mr-1 size-3" /> View History
          </Button>
        </div>

        {startCheck.data && (
          <div className="rounded border border-border p-2 text-xs">
            Check started: ID #{startCheck.data.check_id}
          </div>
        )}

        {statusResult && (
          <CheckResultCard result={statusResult} type="unsealed" />
        )}

        {listLoading && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
        {results && results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Check History ({results.length})
            </h4>
            {results.map((r) => (
              <div
                key={r.check_id}
                className="flex items-center justify-between rounded border border-border p-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground">
                    #{r.check_id}
                  </span>
                  <CheckStatusBadge result={r} />
                  {r.create_time && (
                    <span className="text-muted-foreground">
                      {r.create_time}
                    </span>
                  )}
                </div>
                {!r.complete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      checkStatus.mutate([r.check_id], {
                        onSuccess: (d) => setStatusResult(d),
                      })
                    }
                  >
                    <RefreshCw className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Vanilla Test ---

function VanillaTestPanel() {
  const [sp, setSp] = useState("");
  const [sector, setSector] = useState("");

  const runTest = useCurioRpcMutation<VanillaTestReport>("SectorVanillaTest");

  const handleTest = useCallback(() => {
    if (sp.trim() && sector.trim()) {
      runTest.mutate([sp.trim(), Number.parseInt(sector, 10)]);
    }
  }, [sp, sector, runTest]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vanilla Proof Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              SP Address
            </label>
            <Input
              placeholder="f0..."
              value={sp}
              onChange={(e) => setSp(e.target.value)}
              className="w-40 font-mono text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Sector #
            </label>
            <Input
              placeholder="0"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-28 font-mono text-xs"
            />
          </div>
          <Button
            size="sm"
            onClick={handleTest}
            disabled={!sp.trim() || !sector.trim() || runTest.isPending}
          >
            <Zap className="mr-1 size-3" />
            {runTest.isPending ? "Testing..." : "Run Test"}
          </Button>
        </div>

        {runTest.data && <VanillaReportCard report={runTest.data} />}
      </CardContent>
    </Card>
  );
}

// --- WdPost Test ---

function WdPostTestPanel() {
  const [sp, setSp] = useState("");
  const [deadline, setDeadline] = useState("");
  const [partition, setPartition] = useState("");
  const [taskId, setTaskId] = useState("");

  const startTask = useCurioRpcMutation<WdPostTaskResult>("WdPostTaskStart");
  const checkTask = useCurioRpcMutation<WdPostTaskResult>("WdPostTaskCheck");
  const runPartitionTest = useCurioRpcMutation<VanillaTestReport>(
    "PartitionVanillaTest",
  );

  const handleStart = useCallback(() => {
    if (sp.trim() && deadline.trim() && partition.trim()) {
      startTask.mutate([
        sp.trim(),
        Number.parseInt(deadline, 10),
        Number.parseInt(partition, 10),
      ]);
    }
  }, [sp, deadline, partition, startTask]);

  const handleCheck = useCallback(() => {
    if (taskId.trim()) {
      checkTask.mutate([Number.parseInt(taskId, 10)]);
    }
  }, [taskId, checkTask]);

  const handlePartitionTest = useCallback(() => {
    if (sp.trim() && deadline.trim() && partition.trim()) {
      runPartitionTest.mutate([
        sp.trim(),
        Number.parseInt(deadline, 10),
        Number.parseInt(partition, 10),
      ]);
    }
  }, [sp, deadline, partition, runPartitionTest]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>WindowPoSt Testing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              SP Address
            </label>
            <Input
              placeholder="f0..."
              value={sp}
              onChange={(e) => setSp(e.target.value)}
              className="w-40 font-mono text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Deadline
            </label>
            <Input
              placeholder="0"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-20 font-mono text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Partition
            </label>
            <Input
              placeholder="0"
              value={partition}
              onChange={(e) => setPartition(e.target.value)}
              className="w-20 font-mono text-xs"
            />
          </div>
          <Button
            size="sm"
            onClick={handleStart}
            disabled={
              !sp.trim() ||
              !deadline.trim() ||
              !partition.trim() ||
              startTask.isPending
            }
          >
            <Play className="mr-1 size-3" />
            {startTask.isPending ? "Starting..." : "Start WdPost"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePartitionTest}
            disabled={
              !sp.trim() ||
              !deadline.trim() ||
              !partition.trim() ||
              runPartitionTest.isPending
            }
          >
            <Zap className="mr-1 size-3" />
            {runPartitionTest.isPending ? "Testing..." : "Vanilla Test"}
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Task ID (to check)
            </label>
            <Input
              placeholder="123"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-28 font-mono text-xs"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCheck}
            disabled={!taskId.trim() || checkTask.isPending}
          >
            <Search className="mr-1 size-3" /> Check Result
          </Button>
        </div>

        {startTask.data && <WdPostResultCard result={startTask.data} />}
        {checkTask.data && <WdPostResultCard result={checkTask.data} />}
        {runPartitionTest.data && (
          <VanillaReportCard report={runPartitionTest.data} />
        )}
      </CardContent>
    </Card>
  );
}

// --- Shared Components ---

function CheckStatusBadge({
  result,
}: {
  result: { complete: boolean; ok?: boolean; error?: string };
}) {
  if (result.error) return <StatusBadge status="error" label="Error" />;
  if (!result.complete) return <StatusBadge status="pending" label="Running" />;
  if (result.ok === true) return <StatusBadge status="done" label="OK" />;
  if (result.ok === false) return <StatusBadge status="error" label="Failed" />;
  return <StatusBadge status="info" label="Done" />;
}

function CheckResultCard({
  result,
  type,
}: {
  result: CommRCheckResult | UnsealedCheckResult;
  type: "commr" | "unsealed";
}) {
  return (
    <div className="rounded border border-border p-3 text-xs">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-medium">Check #{result.check_id}</span>
        <CheckStatusBadge result={result} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-muted-foreground sm:grid-cols-3">
        <div>
          SP: <span className="text-foreground">{result.sp_id}</span>
        </div>
        <div>
          Sector:{" "}
          <span className="text-foreground">{result.sector_number}</span>
        </div>
        {type === "commr" && (
          <div>
            Expected:{" "}
            <span className="truncate font-mono text-foreground">
              {(result as CommRCheckResult).expected_comm_r}
            </span>
          </div>
        )}
        {type === "unsealed" && (
          <div>
            Expected CommD:{" "}
            <span className="truncate font-mono text-foreground">
              {(result as UnsealedCheckResult).expected_commd}
            </span>
          </div>
        )}
        {result.message && (
          <div className="col-span-full">{result.message}</div>
        )}
        {result.error && (
          <div className="col-span-full text-destructive">{result.error}</div>
        )}
      </div>
    </div>
  );
}

function VanillaReportCard({ report }: { report: VanillaTestReport }) {
  return (
    <div className="rounded border border-border p-3 text-xs">
      <div className="mb-2 flex items-center gap-3">
        <span className="font-medium">{report.miner}</span>
        <span className="text-muted-foreground">{report.total_time}</span>
      </div>
      <div className="mb-2 flex gap-4">
        <span>
          Tested: <strong>{report.tested_count}</strong>/{report.sector_count}
        </span>
        <span className="text-success">
          Passed: <strong>{report.passed_count}</strong>
        </span>
        <span className="text-destructive">
          Failed: <strong>{report.failed_count}</strong>
        </span>
        <span className="text-warning">
          Slow: <strong>{report.slow_count}</strong>
        </span>
      </div>
      {report.error && <div className="text-destructive">{report.error}</div>}
      {report.results && report.results.length > 0 && (
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {report.results.map((r) => (
            <div
              key={r.sector_number}
              className="flex items-center gap-2 rounded border border-border px-2 py-1"
            >
              <span className="font-mono">#{r.sector_number}</span>
              {r.generate_ok ? (
                <StatusBadge status="done" label="Gen OK" />
              ) : (
                <StatusBadge status="error" label="Gen Fail" />
              )}
              {r.verify_ok ? (
                <StatusBadge status="done" label="Verify OK" />
              ) : (
                <StatusBadge status="error" label="Verify Fail" />
              )}
              {r.slow && <StatusBadge status="warning" label="Slow" />}
              <span className="text-muted-foreground">{r.generate_time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WdPostResultCard({ result }: { result: WdPostTaskResult }) {
  return (
    <div className="rounded border border-border p-3 text-xs">
      <div className="mb-2 flex items-center gap-3">
        <span className="font-medium">Task #{result.task_id}</span>
        <StatusBadge
          status={
            result.error ? "error" : result.submitted ? "done" : "pending"
          }
          label={
            result.error ? "Error" : result.submitted ? "Submitted" : "Pending"
          }
        />
      </div>
      <div className="flex gap-4 text-muted-foreground">
        <span>SP: {result.sp_id}</span>
        <span>Deadline: {result.deadline}</span>
        <span>Partition: {result.partition}</span>
      </div>
      {result.result && <div className="mt-1">{result.result}</div>}
      {result.error && (
        <div className="mt-1 text-destructive">{result.error}</div>
      )}
    </div>
  );
}
