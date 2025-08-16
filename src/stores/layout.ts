import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  // State
  const sidebarCollapsed = ref(false)
  const searchVisible = ref(false)
  const notificationsVisible = ref(false)

  // Actions
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleSearch() {
    searchVisible.value = !searchVisible.value
  }

  function toggleNotifications() {
    notificationsVisible.value = !notificationsVisible.value
  }

  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed
  }

  return {
    // State
    sidebarCollapsed,
    searchVisible,
    notificationsVisible,
    // Actions
    toggleSidebar,
    toggleSearch,
    toggleNotifications,
    setSidebarCollapsed
  }
}, {
  persist: {
    pick: ['sidebarCollapsed']
  }
})