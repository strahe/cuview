import { ref, computed, onMounted, onUnmounted } from "vue";
import { useCurioQuery } from "@/composables/useCurioQuery";
import type {
  WalletNames,
  WalletTableEntry,
  WalletBalanceInfo,
} from "@/types/wallet";

// API response types
interface WalletInfoShortResponse {
  id_address: string;
  key_address: string;
  balance: string;
  pending_messages: number;
}

export interface UseWalletDataOptions {
  balanceRefreshInterval?: number;
  listRefreshInterval?: number;
  immediate?: boolean;
}

export function useWalletData(options: UseWalletDataOptions = {}) {
  const {
    balanceRefreshInterval = 15000, // 15 seconds for balances
    listRefreshInterval = 30000, // 30 seconds for wallet list
    immediate = true,
  } = options;

  const { call } = useCurioQuery();

  // Core data
  const walletNames = ref<WalletNames>({});
  const walletBalances = ref<Map<string, WalletBalanceInfo>>(new Map());
  const walletUIState = ref<
    Map<string, { isEditing: boolean; tempName?: string }>
  >(new Map());

  // Loading and error states
  const listLoading = ref(false);
  const listError = ref<Error | null>(null);
  const lastListUpdate = ref<Date | null>(null);

  // Polling intervals
  let listPollingInterval: NodeJS.Timeout | null = null;
  let balancePollingInterval: NodeJS.Timeout | null = null;

  // Load wallet names list
  const loadWalletNames = async () => {
    try {
      listLoading.value = true;
      listError.value = null;

      const result = await call("WalletNames", []);
      walletNames.value = (result as WalletNames) || {};
      lastListUpdate.value = new Date();

      // Initialize balance entries for new wallets
      Object.keys(walletNames.value).forEach((address) => {
        if (!walletBalances.value.has(address)) {
          walletBalances.value.set(address, {
            address,
            balance: "0",
            pendingMessages: 0,
            loading: false,
          });
        }
        // Initialize UI state for new wallets
        if (!walletUIState.value.has(address)) {
          walletUIState.value.set(address, { isEditing: false });
        }
      });

      // Remove balance entries for removed wallets
      for (const address of walletBalances.value.keys()) {
        if (!(address in walletNames.value)) {
          walletBalances.value.delete(address);
          walletUIState.value.delete(address);
        }
      }
    } catch (error) {
      listError.value =
        error instanceof Error ? error : new Error(String(error));
    } finally {
      listLoading.value = false;
    }
  };

  // Load balance for a specific wallet
  const loadWalletBalance = async (address: string) => {
    const balanceInfo = walletBalances.value.get(address);
    if (!balanceInfo) return;

    try {
      balanceInfo.loading = true;
      balanceInfo.error = undefined;

      // Use WalletInfoShort API as used by curio built-in UI
      const walletInfo = (await call("WalletInfoShort", [
        address,
      ])) as WalletInfoShortResponse;

      if (walletInfo && walletInfo.balance !== undefined) {
        balanceInfo.balance = walletInfo.balance;
        balanceInfo.pendingMessages = walletInfo.pending_messages || 0;
        balanceInfo.lastUpdated = new Date();
      }
    } catch (error) {
      balanceInfo.error =
        error instanceof Error ? error.message : String(error);
    } finally {
      balanceInfo.loading = false;
    }
  };

  // Load all wallet balances asynchronously
  const loadAllBalances = async () => {
    const addresses = Object.keys(walletNames.value);

    // Stagger balance loading to avoid overwhelming the API
    for (const [index, address] of addresses.entries()) {
      // Add a small delay between requests to prevent API overload
      if (index > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Load balance asynchronously (don't await)
      loadWalletBalance(address).catch(console.error);
    }
  };

  // Transform data for table display
  const tableData = computed((): WalletTableEntry[] => {
    return Object.entries(walletNames.value).map(([address, name]) => {
      const balanceInfo = walletBalances.value.get(address);
      const uiState = walletUIState.value.get(address) || { isEditing: false };
      const balance = balanceInfo?.balance || "0";
      // Parse balance value, removing "FIL" suffix if present
      const balanceNumber = parseFloat(
        balance.replace(/\s*FIL$/i, "").trim() || "0",
      );

      return {
        id: address,
        Address: address,
        Name: name,
        Type: (() => {
          // Handle both mainnet (f) and testnet (t) prefixes
          if (address.length < 2) return "unknown";

          const networkPrefix = address[0];
          const protocolChar = address[1];

          // Validate network prefix
          if (networkPrefix !== "f" && networkPrefix !== "t") return "unknown";

          // Map protocol number to type name
          switch (protocolChar) {
            case "0":
              return "id";
            case "1":
              return "secp256k1";
            case "2":
              return "actor";
            case "3":
              return "bls";
            case "4":
              return "delegated";
            default:
              return "unknown";
          }
        })(),
        Balance: balance,
        hasBalance: balanceNumber > 0,
        balanceNumber,
        balanceLoading: balanceInfo?.loading || false,
        balanceError: balanceInfo?.error,
        pendingMessages: balanceInfo?.pendingMessages || 0,
        isEditing: uiState.isEditing,
        tempName: uiState.tempName,
      } as WalletTableEntry;
    });
  });

  // Computed states
  const hasData = computed(() => Object.keys(walletNames.value).length > 0);
  const isLoading = computed(() => listLoading.value);

  // Start polling
  const startPolling = () => {
    stopPolling(); // Clear any existing intervals

    if (listRefreshInterval > 0) {
      listPollingInterval = setInterval(loadWalletNames, listRefreshInterval);
    }

    if (balanceRefreshInterval > 0) {
      balancePollingInterval = setInterval(
        loadAllBalances,
        balanceRefreshInterval,
      );
    }
  };

  // Stop polling
  const stopPolling = () => {
    if (listPollingInterval) {
      clearInterval(listPollingInterval);
      listPollingInterval = null;
    }

    if (balancePollingInterval) {
      clearInterval(balancePollingInterval);
      balancePollingInterval = null;
    }
  };

  // Manual refresh functions
  const refreshWalletList = async () => {
    await loadWalletNames();
    // Also refresh balances after list update
    setTimeout(loadAllBalances, 500);
  };

  const refreshBalances = () => {
    loadAllBalances();
  };

  const refreshAll = async () => {
    await refreshWalletList();
  };

  // UI state management functions
  const setWalletEditing = (
    address: string,
    isEditing: boolean,
    tempName?: string,
  ) => {
    const current = walletUIState.value.get(address) || { isEditing: false };
    walletUIState.value.set(address, {
      isEditing,
      tempName: isEditing ? (tempName ?? current.tempName) : undefined,
    });
  };

  const getWalletUIState = (address: string) => {
    return walletUIState.value.get(address) || { isEditing: false };
  };

  // Auto-start on mount
  onMounted(() => {
    if (immediate) {
      loadWalletNames().then(() => {
        // Load balances after wallet list is loaded
        setTimeout(loadAllBalances, 500);
        startPolling();
      });
    }
  });

  onUnmounted(() => {
    stopPolling();
  });

  return {
    // Data
    walletNames,
    tableData,

    // States
    listLoading: isLoading,
    listError,
    hasData,
    lastListUpdate,

    // Actions
    refreshWalletList,
    refreshBalances,
    refreshAll,
    loadWalletBalance,

    // UI state management
    setWalletEditing,
    getWalletUIState,

    // Polling control
    startPolling,
    stopPolling,
  };
}
