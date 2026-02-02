# Curio Web RPC 完整接口文档

> 来源: `/home/strahe/Projects/strahe/curio/web/api/webrpc/`
> 协议: JSON-RPC 2.0 over WebSocket
> 端点: `/api/webrpc/v0`
> 命名空间: `CurioWeb`

## 一、系统 & 基础 (3)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `Version()` | 无 | `string` | 构建版本号 |
| `BlockDelaySecs()` | 无 | `uint64` | 区块延迟秒数 |
| `SyncerState()` | 无 | `[]RpcInfo` | 链同步状态 |

## 二、Actor/矿工管理 (4)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `ActorSummary()` | 无 | `[]ActorSummary` | 所有SP摘要(算力、余额、获胜等) |
| `ActorList()` | 无 | `[]string` | SP地址列表 |
| `ActorInfo(sp)` | SP地址 | `ActorDetail` | SP详细信息(截止时间、钱包等) |
| `ActorCharts(sp)` | SP地址 | `SectorBuckets` | Actor扇区桶图表数据 |

## 三、任务管理 (7)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `ClusterTaskSummary()` | 无 | `[]TaskSummary` | 活跃任务摘要 |
| `GetTaskStatus(taskID)` | 任务ID | `TaskStatus` | 任务状态 |
| `RestartFailedTask(taskID)` | 任务ID | void | 重启失败任务 |
| `HarmonyTaskStats()` | 无 | `[]HarmonyTaskStats` | 24h任务统计 |
| `HarmonyTaskHistory(name, fails)` | 任务名, 是否失败 | `[]HarmonyTaskHistory` | 任务历史 |
| `HarmonyTaskDetails(taskID)` | 任务ID | `HarmonyTask` | 任务详情 |
| `HarmonyTaskHistoryById(taskID)` | 任务ID | `[]HarmonyTaskHistory` | 按ID查任务历史 |
| `HarmonyTaskMachines(taskName)` | 任务名 | `[]HarmonyMachineDesc` | 能执行此任务的机器 |

## 四、集群管理 (8)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `ClusterMachines()` | 无 | `[]MachineSummary` | 集群机器列表 |
| `ClusterNodeInfo(id)` | 机器ID | `MachineInfo` | 机器详情(存储、任务) |
| `ClusterTaskHistory(limit, offset)` | 分页 | `[]TaskHistorySummary` | 集群任务历史 |
| `ClusterNodeMetrics(id)` | 机器ID | `string` | 机器Prometheus指标 |
| `Cordon(id)` | 机器ID | void | 标记机器不可调度 |
| `Uncordon(id)` | 机器ID | void | 取消不可调度标记 |
| `Restart(id)` | 机器ID | void | 重启机器节点 |
| `AbortRestart(id)` | 机器ID | void | 取消重启 |

## 五、扇区管理 (14)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `SectorInfo(sp, sectorNum)` | SP, 扇区号 | `SectorInfo` | 扇区详情 |
| `SectorResume(sp, sectorNum)` | SP, 扇区号 | void | 恢复扇区 |
| `SectorRemove(sp, sectorNum)` | SP, 扇区号 | void | 移除扇区 |
| `SectorRestart(sp, sectorNum)` | SP, 扇区号 | void | 重启扇区任务 |
| `SectorCCScheduler()` | 无 | `[]SectorCCScheduler` | CC扇区调度器状态 |
| `SectorCCSchedulerEdit(...)` | 调度参数 | void | 编辑CC扇区调度 |
| `SectorCCSchedulerDelete(id)` | 调度ID | void | 删除CC扇区调度 |
| `SectorSPStats()` | 无 | `[]SPSectorStats` | SP扇区统计 |
| `SectorPipelineStats()` | 无 | `[]SectorPipelineStats` | 扇区流水线统计 |
| `SectorDeadlineStats()` | 无 | `[]DeadlineStats` | 截止时间统计 |
| `SectorFileTypeStats()` | 无 | `[]SectorFileTypeStats` | 扇区文件类型统计 |
| `DeadlineDetail(sp, idx)` | SP, 截止时间索引 | `DeadlineDetail` | 截止时间详情 |
| `PartitionDetail(sp, dl, pt)` | SP, 截止时间, 分区 | `PartitionDetail` | 分区详情 |

## 六、扇区到期管理器 (11) 🆕

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `SectorExpBuckets()` | 无 | `[]SectorExpBucket` | 到期桶列表 |
| `SectorExpBucketAdd(...)` | 桶参数 | void | 添加到期桶 |
| `SectorExpBucketDelete(id)` | 桶ID | void | 删除到期桶 |
| `SectorExpBucketCounts()` | 无 | `[]SectorExpBucketCount` | 到期桶计数 |
| `SectorExpManagerPresets()` | 无 | `[]SectorExpManagerPreset` | 到期管理预设 |
| `SectorExpManagerPresetAdd(...)` | 预设参数 | void | 添加预设 |
| `SectorExpManagerPresetUpdate(...)` | 预设参数 | void | 更新预设 |
| `SectorExpManagerPresetDelete(id)` | 预设ID | void | 删除预设 |
| `SectorExpManagerSPs()` | 无 | `[]SectorExpManagerSP` | 到期管理关联的SP |
| `SectorExpManagerSPAdd(...)` | SP参数 | void | 添加SP |
| `SectorExpManagerSPToggle(id)` | SP ID | void | 切换SP状态 |
| `SectorExpManagerSPDelete(id)` | SP ID | void | 删除SP |
| `SectorExpManagerSPEvalCondition(sp, preset)` | SP, 预设 | `bool` | 评估条件 |

## 七、PoRep 流水线 (3)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `PipelinePorepSectors()` | 无 | `[]sectorListEntry` | PoRep扇区列表 |
| `PorepPipelineSummary()` | 无 | `[]PorepPipelineSummary` | PoRep流水线摘要 |
| `PipelinePorepRestartAll()` | 无 | void | 重启所有PoRep任务 |

## 八、Snap/升级流水线 (4)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `UpgradeSectors()` | 无 | `[]UpgradeSector` | Snap升级扇区 |
| `UpgradeResetTaskIDs(...)` | 任务IDs | void | 重置任务ID |
| `UpgradeDelete(...)` | 扇区参数 | void | 删除升级扇区 |
| `PipelineSnapRestartAll()` | 无 | void | 重启所有Snap任务 |

## 九、流水线统计 (3)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `PipelineStatsMarket()` | 无 | `PipelineStats` | 市场流水线统计 |
| `PipelineStatsSnap()` | 无 | `PipelineStats` | Snap流水线统计 |
| `PipelineStatsSDR()` | 无 | `PipelineStats` | SDR流水线统计 |

## 十、存储管理 (11)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `StorageUseStats()` | 无 | `[]StorageUseStats` | 存储使用统计 |
| `StorageStoreTypeStats()` | 无 | `[]StorageStoreStats` | 存储类型统计 |
| `StorageGCStats()` | 无 | `[]StorageGCStats` | GC统计 |
| `StorageGCMarks(miner, sector, limit, offset)` | 过滤参数 | `StorageGCMarks` | GC标记列表 |
| `StorageGCApprove(id)` | 标记ID | void | 批准GC |
| `StorageGCApproveAll()` | 无 | void | 批准所有GC |
| `StorageGCUnapprove(id)` | 标记ID | void | 取消GC批准 |
| `StorageGCUnapproveAll()` | 无 | void | 取消所有GC批准 |
| `StoragePathList()` | 无 | `[]StoragePathInfo` | 🆕 存储路径列表 |
| `StoragePathDetail(id)` | 存储ID | `StoragePathDetailResult` | 🆕 存储路径详情 |
| `StoragePathSectors(id, limit, offset)` | 存储ID, 分页 | `StoragePathSectorsResult` | 🆕 路径下扇区 |
| `StoragePathsSummary()` | 无 | `[]StoragePathInfo` | 🆕 存储路径摘要 |

## 十一、市场 & 交易 (13)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `DealsPending()` | 无 | `[]OpenDealInfo` | 待处理交易 |
| `DealsSealNow(...)` | 交易参数 | void | 立即密封交易 |
| `StorageDealInfo(deal)` | 交易ID | `StorageDealSummary` | 交易详情 |
| `MK12StorageDealList(limit, offset)` | 分页 | `[]StorageDealList` | MK12交易列表 |
| `MK12PipelineFailedTasks()` | 无 | `MK12PipelineFailedStats` | MK12失败统计 |
| `MK20DDOStorageDeal(id)` | 交易ID | `MK20StorageDeal` | MK20交易详情 |
| `MK20DDOStorageDeals(limit, offset)` | 分页 | `[]MK20StorageDealList` | MK20交易列表 |
| `MK20DDOPipelines(limit, offset)` | 分页 | `[]MK20DDOPipeline` | MK20流水线 |
| `MK20PipelineFailedTasks()` | 无 | `MK20PipelineFailedStats` | MK20失败统计 |
| `MK20PDPStorageDeals(limit, offset)` | 分页 | `[]MK20PDPDealList` | PDP交易列表 |
| `MK20PDPPipelines(limit, offset)` | 分页 | `[]MK20PDPPipeline` | PDP流水线 |
| `MarketBalance()` | 无 | `[]MarketBalanceStatus` | 市场余额 |
| `MoveBalanceToEscrow(miner, amount, wallet)` | 参数 | `string` | 转移到托管 |

## 十二、交易过滤 & 配置 (5)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `GetStorageAsk(sp)` | SP地址 | `StorageAsk` | 获取存储报价 |
| `SetStorageAsk(...)` | 报价参数 | void | 设置存储报价 |
| `GetClientFilters()` | 无 | `[]ClientFilter` | 客户端过滤器 |
| `GetPriceFilters()` | 无 | `[]PriceFilter` | 价格过滤器 |
| `GetAllowDenyList()` | 无 | `[]AllowDeny` | 允许/拒绝列表 |
| `DefaultFilterBehaviour()` | 无 | `DefaultFilterBehaviourResponse` | 默认过滤行为 |

## 十三、Piece/内容管理 (4)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `PieceSummary()` | 无 | `PieceSummary` | Piece摘要统计 |
| `PieceInfo(pieceCid)` | CID | `PieceInfo` | Piece详情 |
| `PieceDealDetail(pieceCid)` | CID | `[]PieceDealDetailEntry` | Piece交易详情 |
| `PieceParkStates(pieceCid)` | CID | `ParkedPieceState` | Piece停靠状态 |
| `FindEntriesByDataURL(url)` | URL | `[]PieceParkRefEntry` | 按URL查找条目 |
| `FindContentByCID(cid)` | CID | `[]ContentInfo` | 按CID查找内容 |

## 十四、钱包管理 (7)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `WalletNames()` | 无 | `map[string]string` | 钱包名称映射 |
| `WalletName(id)` | 钱包ID | `string` | 单个钱包名称 |
| `WalletNameChange(id, name)` | 钱包ID, 名称 | void | 修改钱包名称 |
| `WalletAdd(addr)` | 地址 | void | 添加钱包 |
| `WalletRemove(addr)` | 地址 | void | 移除钱包 |
| `WalletInfoShort(id)` | 钱包ID | `WalletInfoShort` | 钱包简要信息 |
| `PendingMessages()` | 无 | `PendingMessages` | 待处理消息 |

## 十五、余额管理器 (4)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `BalanceMgrRules()` | 无 | `[]BalanceMgrRule` | 余额管理规则 |
| `BalanceMgrRuleAdd(...)` | 规则参数 | void | 添加规则 |
| `BalanceMgrRuleUpdate(...)` | 规则参数 | void | 更新规则 |
| `BalanceMgrRuleRemove(id)` | 规则ID | void | 删除规则 |

## 十六、IPNI (4)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `IPNISummary()` | 无 | `[]IPNI` | IPNI摘要 |
| `GetAd(ad)` | 广告CID | `IpniAd` | 获取广告 |
| `IPNIEntry(block)` | 块CID | `EntryInfo` | 获取条目 |
| `IPNISetSkip(...)` | 参数 | void | 设置跳过 |

## 十七、PDP (8)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `PDPServices()` | 无 | `[]PDPService` | PDP服务列表 |
| `AddPDPService(...)` | 服务参数 | void | 添加PDP服务 |
| `RemovePDPService(id)` | 服务ID | void | 删除PDP服务 |
| `ImportPDPKey(hex)` | 私钥hex | `string` | 导入PDP密钥 |
| `ListPDPKeys()` | 无 | `[]string` | PDP密钥列表 |
| `RemovePDPKey(key)` | 密钥 | void | 删除PDP密钥 |
| `FSRegistryStatus()` | 无 | `FSRegistryStatus` | 🆕 FS注册状态 |
| `FSRegister(...)` | 注册参数 | void | 🆕 注册到FS |
| `FSUpdateProvider(...)` | 更新参数 | void | 🆕 更新提供者 |
| `FSUpdatePDP(...)` | 更新参数 | void | 🆕 更新PDP |

## 十八、告警系统 (11) 🆕 全新

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `AlertPendingCount()` | 无 | `int` | 待处理告警数 |
| `AlertUnacknowledgedCount()` | 无 | `int` | 未确认告警数 |
| `AlertCategoriesList()` | 无 | `[]string` | 告警分类列表 |
| `AlertHistoryListPaginated(limit, offset, includeAck)` | 分页, 是否包含已确认 | `AlertHistoryListResult` | 告警历史列表 |
| `AlertAcknowledge(alertID)` | 告警ID | void | 确认告警 |
| `AlertAcknowledgeMultiple(ids)` | 告警ID列表 | void | 批量确认 |
| `AlertCommentAdd(alertID, comment)` | 告警ID, 评论 | void | 添加告警评论 |
| `AlertCommentList(alertID)` | 告警ID | `[]AlertComment` | 告警评论列表 |
| `AlertMuteList()` | 无 | `[]AlertMute` | 静音列表 |
| `AlertMuteAdd(...)` | 静音参数 | void | 添加静音 |
| `AlertMuteRemove(id)` | 静音ID | void | 删除静音 |
| `AlertMuteReactivate(id)` | 静音ID | void | 重新激活 |
| `AlertSendTest()` | 无 | void | 发送测试告警 |

## 十九、证明共享 (20) 🆕 全新

### Provider 端 (9)
| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `PSGetMeta()` | 无 | `ProofShareMeta` | 获取元数据 |
| `PSSetMeta(...)` | 元数据参数 | void | 设置元数据 |
| `PSListAsks()` | 无 | `[]WorkAsk` | 报价列表 |
| `PSAskWithdraw(id)` | 报价ID | void | 撤回报价 |
| `PSListQueue()` | 无 | `[]ProofShareQueueItem` | 队列列表 |
| `PSProviderSettle(providerID)` | 提供者ID | `cid.Cid` | 结算 |
| `PSProviderLastPaymentsSummary()` | 无 | `[]ProviderLastPaymentSummary` | 最近支付摘要 |
| `PSListSettlements()` | 无 | `[]ProofShareSettlementItem` | 结算列表 |
| `PSGetTos()` | 无 | `Tos` | 服务条款 |

### Client 端 (11)
| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `PSClientGet()` | 无 | `[]ProofShareClientSettings` | 客户端设置 |
| `PSClientSet(...)` | 设置参数 | void | 更新设置 |
| `PSClientRequests(spId)` | SP地址 | `[]ProofShareClientRequest` | 客户端请求 |
| `PSClientRemove(spId)` | SP地址 | void | 移除客户端 |
| `PSClientWallets()` | 无 | `[]ProofShareClientWallet` | 客户端钱包 |
| `PSClientAddWallet(...)` | 钱包参数 | void | 添加钱包 |
| `PSClientListMessages()` | 无 | `[]ClientMessage` | 消息列表 |
| `PSClientRouterAddBalance(wallet, amount)` | 钱包, 金额 | `cid.Cid` | 添加余额 |
| `PSClientRouterRequestWithdrawal(wallet, amount)` | 钱包, 金额 | `cid.Cid` | 请求提取 |
| `PSClientRouterCancelWithdrawal(wallet)` | 钱包 | `cid.Cid` | 取消提取 |
| `PSClientRouterCompleteWithdrawal(wallet)` | 钱包 | `cid.Cid` | 完成提取 |

## 二十、CommR/Unsealed检查 (6) 🆕

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `SectorCommRCheckStart(sp, sectorNum, fileType)` | 参数 | `CommRCheckResult` | 启动CommR检查 |
| `SectorCommRCheckStatus(checkID)` | 检查ID | `CommRCheckResult` | 检查状态 |
| `SectorCommRCheckList(sp, sectorNum)` | SP, 扇区号 | `[]CommRCheckResult` | 检查列表 |
| `SectorUnsealedCheckStart(sp, sectorNum)` | SP, 扇区号 | `UnsealedCheckResult` | 启动未密封检查 |
| `SectorUnsealedCheckStatus(checkID)` | 检查ID | `UnsealedCheckResult` | 检查状态 |
| `SectorUnsealedCheckList(sp, sectorNum)` | SP, 扇区号 | `[]UnsealedCheckResult` | 检查列表 |

## 二十一、WdPost 测试 (2) 🆕

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `WdPostTaskStart(sp, deadlineIdx, partitionIdx)` | 参数 | `WdPostTaskResult` | 启动WdPost测试 |
| `WdPostTaskCheck(taskID)` | 任务ID | `WdPostTaskResult` | 检查WdPost结果 |

## 二十二、Vanilla Proof 测试 (2) 🆕

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `PartitionVanillaTest(sp, dl, pt)` | SP, 截止时间, 分区 | `VanillaTestReport` | 分区Vanilla证明测试 |
| `SectorVanillaTest(sp, sectorNum)` | SP, 扇区号 | `VanillaTestReport` | 扇区Vanilla证明测试 |

## 二十三、其他 (7)

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `WinStats()` | 无 | `[]WinStats` | 获胜统计 |
| `EpochPretty(epoch)` | epoch数 | `string` | 格式化epoch |
| `MessageByCid(cid)` | 消息CID | `MessageDetail` | 消息详情 |
| `NetSummary()` | 无 | `NetSummaryResponse` | 网络摘要 |
| `HostToMachineID(hosts)` | 主机列表 | `map[string]int64` | 主机到机器ID映射 |
| `ListMarketContracts()` | 无 | `map[string]string` | 🆕 市场合约 |
| `ChunkUploadStatus(id)` | 上传ID | `UploadStatus` | 🆕 分块上传状态 |

## REST API 端点

### 配置管理
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/config/layers` | GET | 配置层列表 |
| `/api/config/topo` | GET | 配置拓扑 |
| `/api/config/schema` | GET | JSON Schema |
| `/api/config/layers/{layer}` | GET | 获取配置层 |
| `/api/config/addlayer` | POST | 添加配置层 |
| `/api/config/layers/{layer}` | POST | 更新配置层 |
| `/api/config/default` | GET | 默认配置 |
| `/api/config/history/{layer}` | GET | 配置历史 |
| `/api/config/history/{layer}/{id}` | GET | 历史条目 |

### 扇区管理
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sector/all` | GET | 所有扇区 |
| `/api/sector/terminate` | POST | 终止扇区 |

---

**总计: ~157 个 RPC 方法 + 11 个 REST 端点**
