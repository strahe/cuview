import { watch, type Ref } from "vue";

const baseSuffix = "Cuview";

export function usePageTitle() {
  function setTitle(title: string) {
    document.title = `${title} - ${baseSuffix}`;
  }

  function updateTitle(titleRef: Ref<string>) {
    watch(
      titleRef,
      (newTitle) => {
        document.title = `${newTitle} - ${baseSuffix}`;
      },
      { immediate: true },
    );
  }

  return {
    setTitle,
    updateTitle,
  };
}
