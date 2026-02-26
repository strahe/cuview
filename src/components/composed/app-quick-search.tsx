import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { navigationEntries } from "@/layouts/navigation";

export function AppQuickSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (to: string) => {
      setOpen(false);
      navigate({ to });
    },
    [navigate],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Quick Search"
      description="Search for pages"
    >
      <Command>
        <CommandInput placeholder="Search pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {navigationEntries.map((entry) => {
              const Icon = entry.icon;
              return (
                <CommandItem
                  key={entry.to}
                  keywords={entry.keywords}
                  onSelect={() => handleSelect(entry.to)}
                >
                  <Icon className="mr-2 size-4" />
                  <span>{entry.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
