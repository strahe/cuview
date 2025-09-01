# Curio RPC Interface Documentation

This document provides a comprehensive reference for all available RPC methods in the Curio project's WebRPC API. The API uses JSON-RPC over WebSockets and is accessible via the CurioWeb namespace.

## Connection Information

- **Endpoint**: `/api/webrpc/v0`
- **Protocol**: WebSocket with JSON-RPC 2.0
- **Namespace**: `CurioWeb`
- **Authentication**: None (currently open access)

## Basic Methods

### Version Information

#### `CurioWeb.Version()`
Get the Curio build version string.

**Parameters**: None
**Returns**: `string` - Build version (e.g., "1.0.0+git.abc123")

#### `CurioWeb.BlockDelaySecs()`
Get the block delay in seconds for the current network.

**Parameters**: None
**Returns**: `uint64` - Block delay in seconds

## Task Management

### Core Task Operations

#### `CurioWeb.ClusterTaskSummary()`
Get a summary of all active tasks in the cluster.

**Parameters**: None

**Returns**: `[]TaskSummary`
```typescript
interface TaskSummary {
  ID: number;                    // Task ID
  Name: string;                  // Task name/type
  SpID: string;                  // Storage Provider ID
  SincePosted: string;           // ISO timestamp when task was posted
  Owner?: string;                // Machine host:port owning the task
  OwnerID?: number;              // Machine ID owning the task
  SincePostedStr: string;        // Human-readable time since posted
  Miner: string;                 // Miner address (e.g., "f01234")
}
```

#### `CurioWeb.GetTaskStatus(taskID: number)`
Get the current status of a specific task.

**Parameters**:
- `taskID: number` - The task ID to query

**Returns**: `TaskStatus`
```typescript
interface TaskStatus {
  task_id: number;
  status: "pending" | "running" | "done" | "failed";
  owner_id?: number;             // Machine ID if running
  name: string;                  // Task type name
  posted_at?: string;            // ISO timestamp
}
```

#### `CurioWeb.RestartFailedTask(taskID: number)`
Restart a previously failed task.

**Parameters**:
- `taskID: number` - The task ID to restart

**Returns**: `null` (void)

**Error conditions**:
- Task not found in history
- Task is already running or pending  
- Task was successful (cannot restart)

### Task Statistics and History

#### `CurioWeb.HarmonyTaskStats()`
Get 24-hour task completion statistics by task type.

**Parameters**: None

**Returns**: `[]HarmonyTaskStats`
```typescript
interface HarmonyTaskStats {
  name: string;          // Task type name
  true_count: number;    // Successful completions
  false_count: number;   // Failed completions  
  total_count: number;   // Total attempts
}
```

#### `CurioWeb.HarmonyTaskHistory(taskName: string, fails: boolean)`
Get recent task execution history for a specific task type.

**Parameters**:
- `taskName: string` - Task type to filter by
- `fails: boolean` - If false, show only failures; if true, show all

**Returns**: `[]HarmonyTaskHistory`
```typescript
interface HarmonyTaskHistory {
  id: number;
  task_id: number;
  name: string;
  work_start: string;            // ISO timestamp
  work_end: string;              // ISO timestamp
  posted: string;                // ISO timestamp
  took: string;                  // Duration string (e.g., "2.5s")
  result: boolean;               // Success/failure
  err: string;                   // Error message if failed
  completed_by_host_and_port: string;  // Machine that ran task
  completed_by_machine?: number;       // Machine ID
  completed_by_machine_name?: string;  // Human-readable machine name
}
```

#### `CurioWeb.HarmonyTaskDetails(taskID: number)`
Get detailed information about a current task.

**Parameters**:
- `taskID: number` - Task ID to query

**Returns**: `HarmonyTask`
```typescript
interface HarmonyTask {
  id: number;
  name: string;
  update_time: string;           // ISO timestamp
  posted_time: string;           // ISO timestamp
  owner_id?: number;             // Machine ID if assigned
  owner_addr?: string;           // Machine host:port
  owner_name?: string;           // Human-readable machine name
}
```

#### `CurioWeb.HarmonyTaskHistoryById(taskID: number)`
Get execution history for a specific task ID.

**Parameters**:
- `taskID: number` - Task ID to get history for

**Returns**: `[]HarmonyTaskHistory` (same structure as HarmonyTaskHistory above)

#### `CurioWeb.HarmonyTaskMachines(taskName: string)`
Get machines capable of running a specific task type.

**Parameters**:
- `taskName: string` - Task type name

**Returns**: `[]HarmonyMachineDesc`
```typescript
interface HarmonyMachineDesc {
  machine_id: number;
  machine_name: string;
  host_and_port: string;
  miners: string;                // Comma-separated miner addresses
}
```

## Cluster Management

### Machine Information

#### `CurioWeb.ClusterMachines()`
Get information about all machines in the cluster.

**Parameters**: None

**Returns**: `[]MachineSummary`
```typescript
interface MachineSummary {
  Address: string;               // Host:port address
  ID: number;                    // Machine ID
  Name: string;                  // Machine name
  SinceContact: string;          // Time since last contact
  Tasks: string;                 // Comma-separated task types
  Cpu: number;                   // CPU cores
  RamHumanized: string;          // Human-readable RAM (e.g., "16GB")
  Gpu: number;                   // GPU count
  Layers: string;                // Configuration layers
  Uptime: string;                // Human-readable uptime
  Unschedulable: boolean;        // Whether machine accepts new tasks
  RunningTasks: number;          // Current task count (if unschedulable)
}
```

#### `CurioWeb.ClusterNodeInfo(id: number)`
Get detailed information about a specific cluster machine.

**Parameters**:
- `id: number` - Machine ID

**Returns**: `MachineInfo`
```typescript
interface MachineInfo {
  Info: {
    Name: string;
    Host: string;
    ID: number;
    LastContact: string;         // Time since last contact
    CPU: number;
    Memory: number;              // RAM in bytes
    GPU: number;
    Layers: string;              // Configuration layers
    Unschedulable: boolean;
    RunningTasks: number;
  };
  Storage: Array<{
    ID: string;                  // Storage path ID
    Weight: number;
    MaxStorage: number;
    CanSeal: boolean;
    CanStore: boolean;
    Groups: string;
    AllowTo: string;
    AllowTypes: string;
    DenyTypes: string;
    Capacity: number;            // Total capacity in bytes
    Available: number;           // Available space in bytes
    FSAvailable: number;         // Filesystem available space
    Reserved: number;            // Reserved space
    Used: number;                // Used space
    AllowMiners: string;
    DenyMiners: string;
    LastHeartbeat: string;       // ISO timestamp
    HeartbeatErr?: string;       // Error message if any
    UsedPercent: number;         // Usage percentage
    ReservedPercent: number;     // Reserved percentage
  }>;
  RunningTasks: Array<{
    ID: number;
    Task: string;
    Posted: string;              // Time since posted
    PoRepSector?: number;        // Sector number for PoRep tasks
    PoRepSectorSP?: number;      // SP ID for PoRep tasks
    PoRepSectorMiner: string;    // Miner address for PoRep tasks
  }>;
  FinishedTasks: Array<{
    ID: number;
    Task: string;
    Posted: string;              // Formatted timestamp
    Start: string;               // Formatted timestamp
    Queued: string;              // Queue duration
    Took: string;                // Execution duration
    Outcome: string;             // "Success" or "Failed"
    Message: string;             // Error message if failed
  }>;
}
```

#### `CurioWeb.ClusterTaskHistory()`
Get recent task completion history across the cluster.

**Parameters**: None

**Returns**: `[]TaskHistorySummary`
```typescript
interface TaskHistorySummary {
  Name: string;                  // Task type
  TaskID: number;
  Posted: string;                // Formatted timestamp
  Start: string;                 // Formatted timestamp
  Queued: string;                // Queue duration
  Took: string;                  // Execution duration
  Result: boolean;               // Success/failure
  Err: string;                   // Error message if failed
  CompletedBy: string;           // Machine that completed task
}
```

## Storage Provider (Actor) Management

### Actor Information

#### `CurioWeb.ActorSummary()`
Get summary information for all configured storage providers.

**Parameters**: None

**Returns**: `[]ActorSummary`
```typescript
interface ActorSummary {
  Address: string;               // Miner address (e.g., "f01234")
  CLayers: string[];             // Configuration layers
  QualityAdjustedPower: string;  // Decimal string
  RawBytePower: string;          // Decimal string
  ActorBalance: string;          // FIL balance
  ActorAvailable: string;        // Available FIL balance
  VestingFunds: string;          // Vesting funds amount
  InitialPledgeRequirement: string;  // Required initial pledge
  PreCommitDeposits: string;     // Pre-commit deposit amount
  Win1: number;                  // Wins in last 24 hours
  Win7: number;                  // Wins in last 7 days
  Win30: number;                 // Wins in last 30 days
  Deadlines: ActorDeadline[];    // Proving deadline information
}

interface ActorDeadline {
  Empty: boolean;                // No sectors in deadline
  Current: boolean;              // Currently active deadline
  Proven: boolean;               // Successfully proven
  PartFaulty: boolean;          // Some sectors faulty
  Faulty: boolean;              // All sectors faulty
  Count?: {
    Total: number;               // Total sectors
    Active: number;              // Active sectors
    Live: number;                // Live sectors
    Fault: number;               // Faulty sectors
    Recovering: number;          // Recovering sectors
  };
}
```

#### `CurioWeb.ActorInfo(ActorIDstr: string)`
Get detailed information about a specific storage provider.

**Parameters**:
- `ActorIDstr: string` - Miner address (e.g., "f01234")

**Returns**: `ActorDetail`
```typescript
interface ActorDetail {
  Summary: ActorSummary;         // Basic actor summary
  OwnerAddress: string;          // Owner wallet address
  Beneficiary: string;           // Beneficiary address
  WorkerAddress: string;         // Worker address
  WorkerBalance: string;         // Worker balance in FIL
  PeerID: string;                // Libp2p peer ID
  Address: string[];             // Multiaddresses
  SectorSize: number;            // Sector size in bytes
  PendingOwnerAddress?: string;  // Pending owner change
  BeneficiaryTerm?: {
    Quota: string;               // Beneficiary quota in FIL
    UsedQuota: string;           // Used quota in FIL
    Expiration: number;          // Expiration epoch
  };
  PendingBeneficiaryTerm?: {
    NewBeneficiary: string;      // New beneficiary address
    NewQuota: string;            // New quota in FIL
    NewExpiration: number;       // New expiration epoch
    ApprovedByBeneficiary: boolean;
    ApprovedByNominee: boolean;
  };
  Wallets: Array<{
    Type: string;                // Wallet type/role
    Address: string;             // Wallet address
    Balance: string;             // Balance in FIL
  }>;
}
```

#### `CurioWeb.ActorList()`
Get list of all configured miner addresses.

**Parameters**: None

**Returns**: `string[]` - Array of miner addresses (e.g., ["f01234", "f05678"])

### Actor Charts and Statistics

#### `CurioWeb.ActorCharts(maddr: string)`
Get sector statistics for charting/visualization.

**Parameters**:
- `maddr: string` - Miner address

**Returns**: `SectorBuckets` (structure varies based on implementation)

#### `CurioWeb.WinStats()`
Get mining win statistics for all storage providers.

**Parameters**: None

**Returns**: `[]WinStats`
```typescript
interface WinStats {
  // Structure varies - contains win statistics per miner
}
```

## Storage Management

### Storage Statistics

#### `CurioWeb.StorageUseStats()`
Get storage utilization statistics by storage type.

**Parameters**: None

**Returns**: `[]StorageUseStats`
```typescript
interface StorageUseStats {
  can_seal: boolean;             // Can seal sectors
  can_store: boolean;            // Can store sealed sectors
  available: number;             // Available bytes
  capacity: number;              // Total capacity bytes
  Type: string;                  // "Seal", "Store", "Seal/Store", "None"
  UseStr: string;                // Human-readable used space
  CapStr: string;                // Human-readable capacity
}
```

#### `CurioWeb.StorageStoreTypeStats()`
Get detailed storage statistics by file type.

**Parameters**: None

**Returns**: `[]StorageStoreStats`
```typescript
interface StorageStoreStats {
  type: string;                  // File type or "other"
  capacity: number;              // Total capacity bytes
  available: number;             // Available bytes
  used: number;                  // Used bytes
  cap_str: string;               // Human-readable capacity
  use_str: string;               // Human-readable used space
  avail_str: string;             // Human-readable available space
}
```

### Garbage Collection

#### `CurioWeb.StorageGCStats()`
Get garbage collection statistics by storage provider.

**Parameters**: None

**Returns**: `[]StorageGCStats`
```typescript
interface StorageGCStats {
  sp_id: number;                 // Storage provider ID
  count: number;                 // Number of items marked for GC
  Miner: string;                 // Miner address
}
```

#### `CurioWeb.StorageGCMarks(miner?: string, sectorNum?: number, limit: number, offset: number)`
Get storage items marked for garbage collection.

**Parameters**:
- `miner?: string` - Optional miner address filter
- `sectorNum?: number` - Optional sector number filter  
- `limit: number` - Maximum results to return
- `offset: number` - Offset for pagination

**Returns**: `StorageGCMarks`
```typescript
interface StorageGCMarks {
  Marks: Array<{
    sp_id: number;
    sector_num: number;
    sector_filetype: number;
    storage_id: string;
    created_at: string;          // ISO timestamp
    approved: boolean;
    approved_at?: string;        // ISO timestamp if approved
    can_seal: boolean;
    can_store: boolean;
    urls: string;                // Storage URLs
    TypeName: string;            // File type name
    PathType: string;            // "Scratch", "Store", or "Scratch/Store"
    Miner: string;               // Miner address
  }>;
  Total: number;                 // Total count for pagination
}
```

#### `CurioWeb.StorageGCApprove(actor: number, sectorNum: number, fileType: number, storageID: string)`
Approve a specific item for garbage collection.

**Parameters**:
- `actor: number` - Storage provider ID
- `sectorNum: number` - Sector number
- `fileType: number` - File type ID
- `storageID: string` - Storage path ID

**Returns**: `null` (void)

#### `CurioWeb.StorageGCApproveAll()`
Approve all pending items for garbage collection.

**Parameters**: None
**Returns**: `null` (void)

#### `CurioWeb.StorageGCUnapproveAll()`
Remove approval from all garbage collection items.

**Parameters**: None
**Returns**: `null` (void)

## Pipeline Management

### PoRep Pipeline

#### `CurioWeb.PipelinePorepSectors()`
Get status of sectors in the Proof of Replication pipeline.

**Parameters**: None

**Returns**: `[]sectorListEntry` - Array of sectors with their pipeline status

#### `CurioWeb.PorepPipelineSummary()`
Get summary statistics for the PoRep pipeline.

**Parameters**: None

**Returns**: `[]PorepPipelineSummary`

#### `CurioWeb.PipelinePorepRestartAll()`
Restart all failed tasks in the PoRep pipeline.

**Parameters**: None
**Returns**: `null` (void)

### Pipeline Statistics

#### `CurioWeb.PipelineStatsMarket()`
Get pipeline statistics for market (deal) operations.

**Parameters**: None

**Returns**: `PipelineStats`

#### `CurioWeb.PipelineStatsSnap()`
Get pipeline statistics for snap deal operations.

**Parameters**: None

**Returns**: `PipelineStats`

#### `CurioWeb.PipelineStatsSDR()`
Get pipeline statistics for SDR (replication) operations.

**Parameters**: None

**Returns**: `PipelineStats`

#### `CurioWeb.PipelineFailedTasksMarket()`
Get statistics on failed market pipeline tasks.

**Parameters**: None

**Returns**: `PipelineFailedStats`

## Market Operations

### Storage Ask Management

#### `CurioWeb.GetStorageAsk(spID: number)`
Get current storage ask for a storage provider.

**Parameters**:
- `spID: number` - Storage provider ID

**Returns**: `StorageAsk`
```typescript
interface StorageAsk {
  sp_id: number;                 // Storage provider ID
  price: number;                 // Price per GiB per epoch (attoFIL)
  verified_price: number;        // Verified deal price
  min_size: number;              // Minimum deal size
  max_size: number;              // Maximum deal size
  created_at: number;            // Unix timestamp
  expiry: number;                // Expiry epoch
  sequence: number;              // Ask sequence number
  Miner: string;                 // Miner address
}
```

#### `CurioWeb.SetStorageAsk(ask: StorageAsk)`
Set storage ask for a storage provider.

**Parameters**:
- `ask: StorageAsk` - Storage ask configuration

**Returns**: `null` (void)

### Deal Management

#### `CurioWeb.DealsPending()`
Get pending deal information.

**Parameters**: None

**Returns**: `[]OpenDealInfo`

#### `CurioWeb.DealsSealNow(spId: number, sectorNumber: number)`
Force immediate sealing of a sector with deals.

**Parameters**:
- `spId: number` - Storage provider ID
- `sectorNumber: number` - Sector number to seal

**Returns**: `null` (void)

#### `CurioWeb.GetDealPipelines(limit: number, offset: number)`
Get MK12 deal pipeline entries.

**Parameters**:
- `limit: number` - Maximum results
- `offset: number` - Offset for pagination

**Returns**: `[]MK12Pipeline`

#### `CurioWeb.StorageDealInfo(deal: string)`
Get detailed information about a storage deal.

**Parameters**:
- `deal: string` - Deal identifier

**Returns**: `StorageDealSummary`

#### `CurioWeb.MK12StorageDealList(limit: number, offset: number)`
Get list of MK12 storage deals.

**Parameters**:
- `limit: number` - Maximum results
- `offset: number` - Offset for pagination

**Returns**: `[]StorageDealList`

#### `CurioWeb.LegacyStorageDealList(limit: number, offset: number)`
Get list of legacy storage deals.

**Parameters**:
- `limit: number` - Maximum results  
- `offset: number` - Offset for pagination

**Returns**: `[]StorageDealList`

#### `CurioWeb.MK12DDOStorageDealList(limit: number, offset: number)`
Get list of MK12 DDO storage deals.

**Parameters**:
- `limit: number` - Maximum results
- `offset: number` - Offset for pagination

**Returns**: `[]StorageDealList`

### Market Balance Management

#### `CurioWeb.MarketBalance()`
Get market balance status for all storage providers.

**Parameters**: None

**Returns**: `[]MarketBalanceStatus`

#### `CurioWeb.MoveBalanceToEscrow(miner: string, amount: string, wallet: string)`
Move balance from wallet to market escrow.

**Parameters**:
- `miner: string` - Miner address
- `amount: string` - Amount in FIL
- `wallet: string` - Source wallet address

**Returns**: `string` - Transaction CID

### Piece Management

#### `CurioWeb.PieceInfo(pieceCid: string)`
Get information about a piece.

**Parameters**:
- `pieceCid: string` - Piece CID

**Returns**: `PieceInfo`

#### `CurioWeb.PieceParkStates(pieceCID: string)`
Get parked piece state information.

**Parameters**:
- `pieceCID: string` - Piece CID

**Returns**: `ParkedPieceState`

#### `CurioWeb.PieceSummary()`
Get overall piece statistics.

**Parameters**: None

**Returns**: `PieceSummary`

#### `CurioWeb.FindEntriesByDataURL(dataURL: string)`
Find piece entries by data URL.

**Parameters**:
- `dataURL: string` - Data URL to search for

**Returns**: `[]PieceParkRefEntry`

### Deal Pipeline Management

#### `CurioWeb.MK12DealDetail(pieceCid: string)`
Get detailed MK12 deal information.

**Parameters**:
- `pieceCid: string` - Piece CID

**Returns**: `[]MK12DealDetailEntry`

#### `CurioWeb.MK12DealPipelineRemove(uuid: string)`
Remove a deal from the MK12 pipeline.

**Parameters**:
- `uuid: string` - Pipeline entry UUID

**Returns**: `null` (void)

#### `CurioWeb.BulkRestartFailedMarketTasks(taskType: string)`
Restart all failed market tasks of a specific type.

**Parameters**:
- `taskType: string` - Task type to restart

**Returns**: `null` (void)

#### `CurioWeb.BulkRemoveFailedMarketPipelines(taskType: string)`
Remove all failed market pipelines of a specific type.

**Parameters**:
- `taskType: string` - Task type to remove

**Returns**: `null` (void)

## Market Filters and Settings

### Client Filters

#### `CurioWeb.GetClientFilters()`
Get all client filtering rules.

**Parameters**: None

**Returns**: `[]ClientFilter`

#### `CurioWeb.AddClientFilters(name: string, active: boolean, wallets: string[], peers: string[], filters: string[], maxDealPerHour: number, maxDealSizePerHour: number, info: string)`
Add a new client filter rule.

**Parameters**:
- `name: string` - Filter name
- `active: boolean` - Whether filter is active
- `wallets: string[]` - Wallet addresses to filter
- `peers: string[]` - Peer IDs to filter
- `filters: string[]` - Additional filter criteria
- `maxDealPerHour: number` - Maximum deals per hour
- `maxDealSizePerHour: number` - Maximum deal size per hour
- `info: string` - Additional information

**Returns**: `null` (void)

#### `CurioWeb.SetClientFilters(name: string, active: boolean, wallets: string[], peers: string[], filters: string[], maxDealPerHour: number, maxDealSizePerHour: number, info: string)`
Update an existing client filter rule.

**Parameters**: Same as AddClientFilters

**Returns**: `null` (void)

#### `CurioWeb.RemoveClientFilter(name: string)`
Remove a client filter rule.

**Parameters**:
- `name: string` - Filter name to remove

**Returns**: `null` (void)

### Price Filters

#### `CurioWeb.GetPriceFilters()`
Get all price filtering rules.

**Parameters**: None

**Returns**: `[]PriceFilter`

#### `CurioWeb.AddPriceFilters(name: string, minDur: number, maxDur: number, minSize: number, maxSize: number, price: number, verified: boolean)`
Add a new price filter rule.

**Parameters**:
- `name: string` - Filter name
- `minDur: number` - Minimum duration
- `maxDur: number` - Maximum duration
- `minSize: number` - Minimum deal size
- `maxSize: number` - Maximum deal size
- `price: number` - Price threshold
- `verified: boolean` - Apply to verified deals

**Returns**: `null` (void)

#### `CurioWeb.SetPriceFilters(name: string, minDur: number, maxDur: number, minSize: number, maxSize: number, price: number, verified: boolean)`
Update an existing price filter rule.

**Parameters**: Same as AddPriceFilters

**Returns**: `null` (void)

#### `CurioWeb.RemovePricingFilter(name: string)`
Remove a price filter rule.

**Parameters**:
- `name: string` - Filter name to remove

**Returns**: `null` (void)

### Allow/Deny Lists

#### `CurioWeb.GetAllowDenyList()`
Get all allow/deny list entries.

**Parameters**: None

**Returns**: `[]AllowDeny`

#### `CurioWeb.AddAllowDenyList(wallet: string, status: boolean)`
Add a wallet to allow/deny list.

**Parameters**:
- `wallet: string` - Wallet address
- `status: boolean` - true for allow, false for deny

**Returns**: `null` (void)

#### `CurioWeb.SetAllowDenyList(wallet: string, status: boolean)`
Update a wallet's allow/deny status.

**Parameters**: Same as AddAllowDenyList

**Returns**: `null` (void)

#### `CurioWeb.RemoveAllowFilter(wallet: string)`
Remove a wallet from allow/deny list.

**Parameters**:
- `wallet: string` - Wallet address to remove

**Returns**: `null` (void)

#### `CurioWeb.DefaultFilterBehaviour()`
Get default filter behavior configuration.

**Parameters**: None

**Returns**: `DefaultFilterBehaviourResponse`

## Wallet Management

### Wallet Operations

#### `CurioWeb.WalletNames()`
Get names/labels for all configured wallets.

**Parameters**: None

**Returns**: `object` - Map of wallet address to name

#### `CurioWeb.WalletName(id: string)`
Get the name/label for a specific wallet.

**Parameters**:
- `id: string` - Wallet address

**Returns**: `string` - Wallet name

#### `CurioWeb.WalletNameChange(wallet: string, newName: string)`
Change the name/label for a wallet.

**Parameters**:
- `wallet: string` - Wallet address
- `newName: string` - New name for wallet

**Returns**: `null` (void)

#### `CurioWeb.WalletAdd(wallet: string, name: string)`
Add a new wallet with name.

**Parameters**:
- `wallet: string` - Wallet address
- `name: string` - Wallet name

**Returns**: `null` (void)

#### `CurioWeb.WalletRemove(wallet: string)`
Remove a wallet from configuration.

**Parameters**:
- `wallet: string` - Wallet address to remove

**Returns**: `null` (void)

### Message Management

#### `CurioWeb.PendingMessages()`
Get pending messages for all wallets.

**Parameters**: None

**Returns**: `PendingMessages`

#### `CurioWeb.MessageByCid(cid: string)`
Get detailed message information by CID.

**Parameters**:
- `cid: string` - Message CID

**Returns**: `MessageDetail`

## Sector Operations

### Sector Information

#### `CurioWeb.SectorInfo(sp: string, intid: number)`
Get detailed information about a specific sector.

**Parameters**:
- `sp: string` - Storage provider address
- `intid: number` - Sector number

**Returns**: `SectorInfo`

### Sector Management

#### `CurioWeb.SectorResume(spid: number, id: number)`
Resume operations on a paused sector.

**Parameters**:
- `spid: number` - Storage provider ID
- `id: number` - Sector number

**Returns**: `null` (void)

#### `CurioWeb.SectorRemove(spid: number, id: number)`
Remove a sector from the pipeline.

**Parameters**:
- `spid: number` - Storage provider ID
- `id: number` - Sector number

**Returns**: `null` (void)

#### `CurioWeb.SectorRestart(spid: number, id: number)`
Restart sector processing from the beginning.

**Parameters**:
- `spid: number` - Storage provider ID
- `id: number` - Sector number

**Returns**: `null` (void)

## Upgrade Operations

### Sector Upgrades

#### `CurioWeb.UpgradeSectors()`
Get list of sectors available for upgrade.

**Parameters**: None

**Returns**: `[]UpgradeSector`

#### `CurioWeb.UpgradeResetTaskIDs(spid: number, sectorNum: number)`
Reset task IDs for an upgrade sector.

**Parameters**:
- `spid: number` - Storage provider ID
- `sectorNum: number` - Sector number

**Returns**: `null` (void)

#### `CurioWeb.UpgradeDelete(spid: number, sectorNum: number)`
Delete an upgrade sector entry.

**Parameters**:
- `spid: number` - Storage provider ID
- `sectorNum: number` - Sector number

**Returns**: `null` (void)

#### `CurioWeb.PipelineSnapRestartAll()`
Restart all snap upgrade pipeline operations.

**Parameters**: None

**Returns**: `null` (void)

## IPNI Integration

### IPNI Operations

#### `CurioWeb.IPNISummary()`
Get summary of IPNI advertisement status.

**Parameters**: None

**Returns**: `[]IPNI`

#### `CurioWeb.GetAd(ad: string)`
Get details of a specific IPNI advertisement.

**Parameters**:
- `ad: string` - Advertisement CID

**Returns**: `IpniAd`

#### `CurioWeb.IPNIEntry(block: string)`
Get IPNI entry information for a block.

**Parameters**:
- `block: string` - Block CID

**Returns**: `EntryInfo`

#### `CurioWeb.IPNISetSkip(adCid: string, skip: boolean)`
Set skip status for an IPNI advertisement.

**Parameters**:
- `adCid: string` - Advertisement CID
- `skip: boolean` - Whether to skip this advertisement

**Returns**: `null` (void)

## PDP (Proof of Data Possession)

### PDP Service Management

#### `CurioWeb.PDPServices()`
Get list of configured PDP services.

**Parameters**: None

**Returns**: `[]PDPService`

#### `CurioWeb.AddPDPService(name: string, pubKey: string)`
Add a new PDP service.

**Parameters**:
- `name: string` - Service name
- `pubKey: string` - Public key

**Returns**: `null` (void)

#### `CurioWeb.RemovePDPService(id: number)`
Remove a PDP service.

**Parameters**:
- `id: number` - Service ID

**Returns**: `null` (void)

### PDP Key Management

#### `CurioWeb.ListPDPKeys()`
Get list of configured PDP keys.

**Parameters**: None

**Returns**: `string[]` - Array of key addresses

#### `CurioWeb.ImportPDPKey(hexPrivateKey: string)`
Import a PDP private key.

**Parameters**:
- `hexPrivateKey: string` - Hex-encoded private key

**Returns**: `string` - Imported key address

#### `CurioWeb.RemovePDPKey(ownerAddress: string)`
Remove a PDP key.

**Parameters**:
- `ownerAddress: string` - Key owner address

**Returns**: `null` (void)

## Sync State Management

#### `CurioWeb.SyncerState()`
Get synchronization state information for chain connections.

**Parameters**: None

**Returns**: `[]RpcInfo`

## Utility Methods

### Time and Epoch

#### `CurioWeb.EpochPretty(e: number)`
Convert epoch number to human-readable format.

**Parameters**:
- `e: number` - Chain epoch number

**Returns**: `string` - Human-readable time

## Error Handling

All RPC methods can return standard JSON-RPC errors:

- **-32700**: Parse error (Invalid JSON)
- **-32600**: Invalid request (Invalid JSON-RPC)  
- **-32601**: Method not found
- **-32602**: Invalid params
- **-32603**: Internal error
- **-32000 to -32099**: Server-defined errors

Common application-specific errors:
- Database connection errors
- Invalid storage provider IDs
- Task not found errors
- Permission denied errors
- Resource not found errors

## Usage Examples

### WebSocket Connection (JavaScript)
```javascript
const ws = new WebSocket('ws://localhost:8080/api/webrpc/v0');
const client = new JsonRpcClient(ws);

// Get cluster task summary
const tasks = await client.call('CurioWeb.ClusterTaskSummary');

// Get task status
const taskStatus = await client.call('CurioWeb.GetTaskStatus', [12345]);

// Get storage provider info
const actors = await client.call('CurioWeb.ActorSummary');
```

### curl Examples (HTTP POST to WebSocket endpoint not directly supported)
WebSocket connections require a WebSocket client. For testing, use a WebSocket tool or implement a simple client.

## Database Schema Dependencies

The RPC methods rely on several core database tables:
- `harmony_task` - Active tasks
- `harmony_task_history` - Completed task history  
- `harmony_machines` - Cluster machine information
- `harmony_machine_details` - Extended machine details
- `sectors_sdr_pipeline` - PoRep pipeline status
- `storage_path` - Storage path configuration
- `storage_removal_marks` - GC marked items
- Various market and deal tables for MK12 functionality

## Security Considerations

**Current State**: No authentication required
**Recommended**: Implement authentication/authorization before production use
**Access Control**: Currently allows full cluster access to any connected client
**Network Security**: Should be used behind firewall/VPN in production

## Version Compatibility

This documentation reflects the API as of the current Curio codebase. Method signatures and return types may change between versions. Always check the `Version()` method to confirm API compatibility.