<script setup lang="ts">
import { computed } from 'vue'
import { useCachedQuery } from '@/composables/useCachedQuery'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline'

interface HarmonyTaskStat {
  Name: string
  TrueCount: number
  FalseCount: number
  TotalCount: number
}

interface TaskStatWithPercentage extends HarmonyTaskStat {
  FailedPercentage: string
  isError: boolean
}

const { data: rawData, loading, error, hasData } = useCachedQuery<HarmonyTaskStat[]>('HarmonyTaskStats', [], {
  pollingInterval: 30000
})

const isInitialLoading = computed(() => loading.value && !hasData.value)
const processedData = computed<TaskStatWithPercentage[]>(() => {
  if (rawData.value && rawData.value.length > 0) {
    return rawData.value.map(task => ({
      ...task,
      FailedPercentage: task.FalseCount > 0 
        ? `${((task.FalseCount / task.TotalCount) * 100).toFixed(2)}%` 
        : '0%',
      isError: task.FalseCount > task.TrueCount && task.TrueCount === 0
    }))
  }
  return []
})

const getSuccessRate = (task: TaskStatWithPercentage): number => {
  return task.TotalCount > 0 ? (task.TrueCount / task.TotalCount) * 100 : 0
}

const getStatusBadge = (task: TaskStatWithPercentage) => {
  if (task.isError) {
    return { class: 'badge-error', icon: XCircleIcon }
  }
  if (task.FalseCount === 0) {
    return { class: 'badge-success', icon: CheckCircleIcon }
  }
  return { class: 'badge-warning', icon: null }
}

</script>

<template>
  <div class="space-y-4">
    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Task</th>
            <th>Success Rate</th>
            <th>Successful</th>
            <th>Failed</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="task in processedData" 
            :key="task.Name"
            :class="{ 'bg-error/10': task.isError }"
          >
            <td class="font-medium">
              <span :class="{ 'text-error': task.isError }">
                {{ task.Name }}
              </span>
            </td>
            
            <td>
              <div class="flex items-center gap-2">
                <div class="w-16 text-sm font-medium">
                  {{ getSuccessRate(task).toFixed(1) }}%
                </div>
                <progress 
                  class="progress progress-sm w-20"
                  :class="task.isError ? 'progress-error' : task.FalseCount === 0 ? 'progress-success' : 'progress-warning'"
                  :value="getSuccessRate(task)" 
                  max="100"
                ></progress>
              </div>
            </td>
            
            <td>
              <div class="flex items-center gap-2">
                <CheckCircleIcon class="size-4 text-success" />
                <span class="font-medium">{{ task.TrueCount }}</span>
              </div>
            </td>
            
            <td>
              <div class="flex items-center gap-2">
                <XCircleIcon class="size-4 text-error" />
                <span class="font-medium">{{ task.FalseCount }}</span>
                <span class="text-sm text-base-content/70">({{ task.FailedPercentage }})</span>
              </div>
            </td>
            
            <td>
              <div :class="['badge', getStatusBadge(task).class]">
                <component 
                  v-if="getStatusBadge(task).icon" 
                  :is="getStatusBadge(task).icon" 
                  class="size-3 mr-1" 
                />
                {{ task.isError ? 'Error' : task.FalseCount === 0 ? 'Healthy' : 'Warning' }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="isInitialLoading" class="text-center py-8 text-base-content/60">
        <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
        Loading task statistics...
      </div>
      
      <div v-else-if="error" class="text-center py-8 text-error">
        <div class="text-lg mb-2">📊 Task Stats Error</div>
        <div class="text-sm">{{ error.message }}</div>
      </div>
      
      <div v-else-if="processedData.length === 0 && !loading" class="text-center py-8 text-base-content/60">
        <div class="text-4xl mb-2">📊</div>
        <div>No task statistics available</div>
      </div>
    </div>

    <div class="stats shadow">
      <div class="stat">
        <div class="stat-title">Total Tasks</div>
        <div class="stat-value text-primary">{{ processedData.length }}</div>
      </div>
      
      <div class="stat">
        <div class="stat-title">Healthy Tasks</div>
        <div class="stat-value text-success">
          {{ processedData.filter(t => t.FalseCount === 0).length }}
        </div>
      </div>
      
      <div class="stat">
        <div class="stat-title">Failed Tasks</div>
        <div class="stat-value text-error">
          {{ processedData.filter(t => t.isError).length }}
        </div>
      </div>
    </div>
  </div>
</template>