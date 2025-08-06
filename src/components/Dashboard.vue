<script setup lang="ts">
import { 
  ChartBarIcon as BarChart3,
  ServerIcon as Server,
  CircleStackIcon as Database,
  UsersIcon as Users,
  BoltIcon as Activity,
  CogIcon as Settings,
  PlusIcon as Plus,
  ArrowPathIcon as RefreshCw,
  RocketLaunchIcon as Gauge,
  CpuChipIcon as Cpu,
  ServerStackIcon as HardDrive,
  GlobeAltIcon as Globe,
  ShieldCheckIcon as ShieldCheck
} from '@heroicons/vue/24/outline'

// Import our new reusable components
import KPICard from '@/components/ui/KPICard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ProgressStat from '@/components/ui/ProgressStat.vue'
import ActivityItem from '@/components/ui/ActivityItem.vue'
</script>

<template>
  <div class="p-6 space-y-8">
    <!-- FAB -->
    <button class="btn btn-circle btn-primary fixed right-6 bottom-6 z-20 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
      <Plus class="size-6" />
    </button>
    
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Cuview Dashboard
        </h1>
        <p class="text-base-content/70 mt-1">Modern control panel for your Curio stack</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-outline btn-sm">
          <RefreshCw class="w-4 h-4" />
          Refresh
        </button>
        <button class="btn btn-primary btn-sm">
          <Plus class="w-4 h-4" />
          New Instance
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <KPICard 
        title="Active Instances"
        :value="8"
        change="+2 from last hour"
        trend="up"
        :icon="Server"
        icon-color="primary"
      />
      
      <KPICard 
        title="Total Queries" 
        :value="2847"
        change="+180 from last hour"
        trend="up"
        :icon="BarChart3"
        icon-color="info"
      />
      
      <KPICard 
        title="Connected Users"
        :value="24"
        change="+3 from last hour" 
        trend="up"
        :icon="Users"
        icon-color="secondary"
      />
      
      <KPICard 
        title="System Health"
        value="98.2%"
        change="+0.1% from yesterday"
        trend="up"
        :icon="Activity"
        icon-color="success"
      />
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Traffic / Chart placeholder -->
      <div class="card bg-base-100 shadow-xl xl:col-span-2">
        <div class="card-header">
          <div class="card-title flex items-center gap-2">
            <Globe class="size-5" /> Traffic
          </div>
          <p class="text-base-content/70">Requests and latency over time</p>
        </div>
        <div class="card-body">
          <div class="relative rounded-2xl border border-base-300 bg-gradient-to-b from-base-100 to-base-200/30 p-4">
            <div class="relative h-56 md:h-64 rounded-md border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10"></div>
          </div>
          <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="rounded-lg border border-base-300 p-3">
              <p class="text-xs text-base-content/60">P95 Latency</p>
              <p class="mt-1 text-lg font-semibold">121 ms</p>
            </div>
            <div class="rounded-lg border border-base-300 p-3">
              <p class="text-xs text-base-content/60">Error Rate</p>
              <p class="mt-1 text-lg font-semibold">0.23%</p>
            </div>
            <div class="rounded-lg border border-base-300 p-3">
              <p class="text-xs text-base-content/60">Throughput</p>
              <p class="mt-1 text-lg font-semibold">3.1k rps</p>
            </div>
            <div class="rounded-lg border border-base-300 p-3">
              <p class="text-xs text-base-content/60">Cache Hit</p>
              <p class="mt-1 text-lg font-semibold">92%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Status / Overview -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-header">
          <div class="card-title flex items-center gap-2">
            <ShieldCheck class="size-5" /> Status
          </div>
          <p class="text-base-content/70">Current system signals</p>
        </div>
        <div class="card-body space-y-4">
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm">API Gateway</span>
            <StatusBadge status="success" label="Healthy" />
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm">WebSocket</span>
            <StatusBadge status="info" label="Stable" />
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm">Rate Limit</span>
            <StatusBadge status="warning" label="Watch" />
          </div>
          
          <div class="divider"></div>
          
          <div class="space-y-3">
            <ProgressStat 
              label="Memory"
              :value="72"
              color="info"
            />
            <ProgressStat 
              label="CPU" 
              :value="45"
              color="success"
            />
            <ProgressStat 
              label="Storage"
              :value="89" 
              color="warning"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Lists & Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="card bg-base-100 shadow-xl lg:col-span-2">
        <div class="card-header">
          <div class="card-title flex items-center gap-2">
            <Activity class="size-5" /> Recent Activity
          </div>
          <p class="text-base-content/70">Latest API calls and events</p>
        </div>
        <div class="card-body space-y-3">
          <ActivityItem 
            title="Query executed successfully"
            description="curio.storage.list() · 2m ago"
            status="success"
            status-label="Success"
          />
          <ActivityItem 
            title="New client connected"
            description="WebSocket session established · 5m ago"
            status="info"
            status-label="Info"
          />
          <ActivityItem 
            title="Rate limit warning"
            description="Client exceeded 100 req/min · 8m ago"
            status="warning"
            status-label="Warning"
          />
          <ActivityItem 
            title="Database backup completed"
            description="Automated backup process · 15m ago"
            status="success"
            status-label="System"
          />
        </div>
        <div class="card-footer">
          <button class="btn btn-outline w-full">View All</button>
        </div>
      </div>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-header">
          <div class="card-title flex items-center gap-2">
            <Gauge class="size-5" /> System Resources
          </div>
          <p class="text-base-content/70">CPU · Memory · Disk</p>
        </div>
        <div class="card-body space-y-4">
          <ProgressStat 
            label="CPU"
            :value="45"
            color="success"
            :icon="Cpu"
          />
          <ProgressStat 
            label="Memory" 
            :value="72"
            color="info"
            :icon="Database"
          />
          <ProgressStat 
            label="Storage"
            :value="89"
            color="warning"
            :icon="HardDrive"
          />
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-header">
        <div class="card-title">Quick Actions</div>
        <p class="text-base-content/70">Frequently used tools</p>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button class="btn btn-outline h-24 flex-col gap-2">
            <Database class="w-6 h-6" />
            <span class="text-sm">Query Builder</span>
          </button>
          <button class="btn btn-outline h-24 flex-col gap-2">
            <BarChart3 class="w-6 h-6" />
            <span class="text-sm">Analytics</span>
          </button>
          <button class="btn btn-outline h-24 flex-col gap-2">
            <Settings class="w-6 h-6" />
            <span class="text-sm">Settings</span>
          </button>
          <button class="btn btn-outline h-24 flex-col gap-2">
            <Activity class="w-6 h-6" />
            <span class="text-sm">Monitoring</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>