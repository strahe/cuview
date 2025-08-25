import { ref, computed } from "vue";
import { defineStore } from "pinia";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export const useConnectionStore = defineStore("connection", () => {
  const status = ref<ConnectionStatus>("connecting");
  const reconnectAttempt = ref(0);

  const isConnected = computed(() => status.value === "connected");
  const isReconnecting = computed(() => status.value === "reconnecting");

  const setStatus = (newStatus: ConnectionStatus) => {
    status.value = newStatus;
    if (newStatus === "connected") {
      reconnectAttempt.value = 0;
    }
  };

  const setReconnectAttempt = (attempt: number) => {
    reconnectAttempt.value = attempt;
  };

  return {
    status,
    reconnectAttempt,
    isConnected,
    isReconnecting,
    setStatus,
    setReconnectAttempt,
  };
});
