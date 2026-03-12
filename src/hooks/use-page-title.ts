import { useEffect } from "react";

export function usePageTitle(title?: string) {
  useEffect(() => {
    const baseTitle = "Cuview";
    const previousTitle = document.title;
    document.title = title ? `${title} - ${baseTitle}` : baseTitle;

    return () => {
      document.title = previousTitle || baseTitle;
    };
  }, [title]);
}
