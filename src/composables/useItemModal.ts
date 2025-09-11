import { ref, type Ref } from "vue";

/**
 * Composable for managing item detail modal state
 * @template T The type of the item being displayed in the modal
 */
export function useItemModal<T = unknown>() {
  const showModal: Ref<boolean> = ref(false);
  const selectedItem: Ref<T | null> = ref(null);

  /**
   * Opens the modal with the specified item
   */
  const openModal = (item: T) => {
    selectedItem.value = item;
    showModal.value = true;
  };

  /**
   * Closes the modal and clears the selected item
   */
  const closeModal = () => {
    showModal.value = false;
    selectedItem.value = null;
  };

  /**
   * Handles modal close event
   */
  const handleModalClose = () => {
    closeModal();
  };

  return {
    // State
    showModal,
    selectedItem,
    // Actions
    openModal,
    closeModal,
    handleModalClose,
  };
}
