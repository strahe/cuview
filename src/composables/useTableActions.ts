import { ref, computed, type Ref } from "vue";

/**
 * Configuration for a single table action
 */
export interface TableAction<T> {
  /** Action name for identification */
  name: string;
  /** Action handler function */
  handler: (item: T) => Promise<void>;
  /** Custom key generation for tracking loading state (optional) */
  loadingKey?: (item: T) => string;
  /** Success callback executed after successful action (optional) */
  onSuccess?: (item: T) => void;
  /** Error callback executed on action failure (optional) */
  onError?: (item: T, error: Error) => void;
  /** Whether to show confirmation dialog (optional) */
  requiresConfirmation?: boolean;
  /** Confirmation message generator (optional) */
  confirmationMessage?: (item: T) => string;
}

/**
 * Configuration for useTableActions composable
 */
export interface TableActionsConfig<T> {
  /** Record of available actions */
  actions: Record<string, TableAction<T>>;
  /** Default key generator for items if no custom one provided */
  defaultKeyGenerator?: (item: T) => string;
  /** Global refresh callback executed after successful actions */
  onRefresh?: () => void;
}

/**
 * Result interface for useTableActions composable
 */
export interface TableActionsResult<T> {
  /** Check if specific action is loading for specific item */
  isLoading: (actionName: string, item: T) => boolean;
  /** Execute an action for a specific item */
  executeAction: (actionName: string, item: T) => Promise<void>;
  /** Reactive map of loading states per action */
  loadingStates: Ref<Map<string, Set<string>>>;
  /** Check if any action is currently loading */
  hasLoadingActions: Ref<boolean>;
}

/**
 * Composable for managing table action states and execution
 *
 * Provides unified handling for:
 * - Loading state tracking per action per item
 * - Error handling with customizable callbacks
 * - Success callbacks and global refresh
 * - Confirmation dialogs for destructive actions
 * - Flexible item key generation
 *
 * @param config - Configuration object with actions and callbacks
 * @returns Object with loading state checks and action execution
 */
export function useTableActions<T>(
  config: TableActionsConfig<T>,
): TableActionsResult<T> {
  const { actions, defaultKeyGenerator, onRefresh } = config;

  const loadingStates = ref<Map<string, Set<string>>>(new Map());

  const hasLoadingActions = computed(() => {
    for (const actionSet of loadingStates.value.values()) {
      if (actionSet.size > 0) return true;
    }
    return false;
  });

  /**
   * Generate a unique key for an item using action-specific or default key generator
   */
  function getItemKey(actionName: string, item: T): string {
    const action = actions[actionName];
    if (!action) {
      throw new Error(`Unknown action: ${actionName}`);
    }

    // Use action-specific key generator if provided
    if (action.loadingKey) {
      return action.loadingKey(item);
    }

    // Use default key generator if provided
    if (defaultKeyGenerator) {
      return defaultKeyGenerator(item);
    }

    // Fallback to JSON stringify (not recommended for production)
    console.warn(
      `No key generator provided for action "${actionName}". Using JSON.stringify as fallback.`,
    );
    return JSON.stringify(item);
  }

  /**
   * Check if a specific action is currently loading for a specific item
   */
  function isLoading(actionName: string, item: T): boolean {
    const actionSet = loadingStates.value.get(actionName);
    if (!actionSet) return false;

    const itemKey = getItemKey(actionName, item);
    return actionSet.has(itemKey);
  }

  /**
   * Execute an action for a specific item with full lifecycle management
   */
  async function executeAction(actionName: string, item: T): Promise<void> {
    const action = actions[actionName];
    if (!action) {
      throw new Error(`Unknown action: ${actionName}`);
    }

    if (action.requiresConfirmation) {
      const message = action.confirmationMessage
        ? action.confirmationMessage(item)
        : `Are you sure you want to ${actionName}?`;

      if (!window.confirm(message)) {
        return;
      }
    }

    const itemKey = getItemKey(actionName, item);

    if (!loadingStates.value.has(actionName)) {
      loadingStates.value.set(actionName, new Set());
    }

    const actionSet = loadingStates.value.get(actionName)!;

    if (actionSet.has(itemKey)) {
      console.warn(
        `Action "${actionName}" is already executing for item with key "${itemKey}"`,
      );
      return;
    }

    try {
      actionSet.add(itemKey);

      await action.handler(item);

      if (action.onSuccess) {
        action.onSuccess(item);
      }

      if (onRefresh) {
        onRefresh();
      }

      console.log(
        `Successfully executed action "${actionName}" for item with key "${itemKey}"`,
      );
    } catch (error) {
      const err = error as Error;

      if (action.onError) {
        action.onError(item, err);
      } else {
        console.error(
          `Failed to execute action "${actionName}" for item with key "${itemKey}":`,
          err,
        );
      }

      throw err;
    } finally {
      actionSet.delete(itemKey);

      if (actionSet.size === 0) {
        loadingStates.value.delete(actionName);
      }
    }
  }

  return {
    isLoading,
    executeAction,
    loadingStates,
    hasLoadingActions,
  };
}
