<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCachedQuery } from '@/composables/useCachedQuery'
import { useCurioQuery } from '@/composables/useCurioQuery'
import { PauseIcon, PlayIcon, ArrowPathIcon, XCircleIcon } from '@heroicons/vue/24/outline'

interface ClusterMachine {
  ID: number
  Name: string
  Address: string
  Cpu: number
  RamHumanized: string
  Gpu: number
  SinceContact: string
  Uptime: string
  Unschedulable: boolean
  Restarting: boolean
  RunningTasks: number
  RestartRequest: string
  Tasks: string
  Layers: string
}


const { call } = useCurioQuery()
const detailed = ref(false)

const { data: machines, loading, error, refresh, hasData } = useCachedQuery<ClusterMachine[]>('ClusterMachines', [], {
  pollingInterval: 5000
})

const isInitialLoading = computed(() => loading.value && !hasData.value)

const cordon = async (id: number) => {
  try {
    await call('Cordon', [id])
    refresh()
  } catch (error) {
    console.error('Failed to cordon machine:', error)
  }
}

const uncordon = async (id: number) => {
  try {
    await call('Uncordon', [id])
    refresh()
  } catch (error) {
    console.error('Failed to uncordon machine:', error)
  }
}

const restart = async (id: number) => {
  try {
    await call('Restart', [id])
    refresh()
  } catch (error) {
    console.error('Failed to restart machine:', error)
  }
}

const abortRestart = async (id: number) => {
  try {
    await call('AbortRestart', [id])
    refresh()
  } catch (error) {
    console.error('Failed to abort restart:', error)
  }
}

const getStatusBadge = (item: ClusterMachine) => {
  if (item.Restarting) {
    return { text: `restarting (since ${item.RestartRequest})`, class: 'badge-error' }
  }
  if (!item.Unschedulable) {
    return { text: 'enabled', class: 'badge-success' }
  }
  if (item.RunningTasks > 0) {
    return { text: `cordoned (${item.RunningTasks} tasks running)`, class: 'badge-warning' }
  }
  return { text: 'cordoned', class: 'badge-warning' }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <label class="label cursor-pointer gap-2">
        <input 
          type="checkbox" 
          class="toggle toggle-primary" 
          v-model="detailed"
        />
        <span class="label-text">Detailed View</span>
      </label>
      
      <!-- Empty space for layout consistency -->
      <div class="min-h-[24px]"></div>
    </div>

    <div class="overflow-x-auto">
      <table class="table table-zebra table-fixed">
        <thead>
          <tr>
            <th class="w-32">Name</th>
            <th class="w-40">Host</th>
            <th class="w-16">ID</th>
            <th v-if="detailed" class="w-16">CPUs</th>
            <th v-if="detailed" class="w-20">RAM</th>
            <th v-if="detailed" class="w-16">GPUs</th>
            <th class="w-32">Last Contact</th>
            <th class="w-24">Uptime</th>
            <th class="w-48">Status</th>
            <th class="w-32">Actions</th>
            <th v-if="detailed" class="w-40">Tasks</th>
            <th v-if="detailed" class="w-40">Layers</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in machines" :key="item.ID">
            <td class="font-medium truncate">{{ item.Name }}</td>
            <td class="font-mono text-sm truncate">{{ item.Address }}</td>
            <td class="text-sm text-base-content/70">{{ item.ID }}</td>
            
            <td v-if="detailed">{{ item.Cpu }}</td>
            <td v-if="detailed">{{ item.RamHumanized }}</td>
            <td v-if="detailed">{{ item.Gpu }}</td>
            
            <td class="text-sm">{{ item.SinceContact }}</td>
            <td class="text-sm">{{ item.Uptime }}</td>
            
            <td>
              <div :class="['badge', getStatusBadge(item).class]">
                {{ getStatusBadge(item).text }}
              </div>
            </td>
            
            <td>
              <div class="flex items-center gap-1">
                <button 
                  class="btn btn-ghost btn-xs"
                  :class="{ 'opacity-30': item.Unschedulable }"
                  :disabled="item.Unschedulable"
                  @click="cordon(item.ID)"
                  title="Cordon (Pause)"
                >
                  <PauseIcon class="size-4" />
                </button>
                
                <button 
                  class="btn btn-ghost btn-xs"
                  :class="{ 'opacity-30': !item.Unschedulable }"
                  :disabled="!item.Unschedulable"
                  @click="uncordon(item.ID)"
                  title="Uncordon (Resume)"
                >
                  <PlayIcon class="size-4" />
                </button>
                
                <div class="w-8 flex justify-center">
                  <button 
                    v-if="!item.Restarting"
                    class="btn btn-ghost btn-xs"
                    :class="{ 'opacity-30': !item.Unschedulable }"
                    :disabled="!item.Unschedulable"
                    @click="restart(item.ID)"
                    title="Restart"
                  >
                    <ArrowPathIcon class="size-4" />
                  </button>
                  
                  <button 
                    v-else
                    class="btn btn-ghost btn-xs"
                    @click="abortRestart(item.ID)"
                    title="Abort Restart"
                  >
                    <XCircleIcon class="size-4" />
                  </button>
                </div>
              </div>
            </td>
            
            <td v-if="detailed">
              <div class="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                <span 
                  v-for="task in (item.Tasks || '').split(',').map(t => t.trim()).filter(t => t)" 
                  :key="task"
                  class="badge badge-outline badge-sm"
                >
                  {{ task }}
                </span>
              </div>
            </td>
            
            <td v-if="detailed">
              <div class="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                <span 
                  v-for="layer in (item.Layers || '').split(',').map(l => l.trim()).filter(l => l)" 
                  :key="layer"
                  class="badge badge-outline badge-sm"
                >
                  {{ layer }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="isInitialLoading" class="text-center py-8 text-base-content/60">
        <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
        Loading cluster machines...
      </div>
      
      <div v-else-if="error" class="text-center py-8 text-error">
        <div class="text-lg mb-2">⚠️ Connection Error</div>
        <div class="text-sm">{{ error.message }}</div>
        <button @click="refresh" class="btn btn-sm btn-outline btn-error mt-3">
          <ArrowPathIcon class="size-4" />
          Retry
        </button>
      </div>
      
      <div v-else-if="!machines || machines.length === 0 && !loading" class="text-center py-8 text-base-content/60">
        <div class="text-4xl mb-2">🖥️</div>
        <div>No cluster machines available</div>
      </div>
    </div>
  </div>
</template>