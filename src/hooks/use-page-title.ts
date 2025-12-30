import { useEffect } from "react";

export function usePageTitle(title?: string) {
  useEffect(() => {
    const baseTitle = "Cuview";
    document.title = title ? `${title} - ${baseTitle}` : baseTitle;

    return () => {
      document.title = baseTitle;
    };
  }, [title]);
}
