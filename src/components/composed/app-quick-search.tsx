import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/composed/command";
import { Dialog, DialogContent } from "@/components/composed/dialog";
import { navigationEntries } from "@/layouts/navigation";

export function AppQuickSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = navigationEntries.filter((entry) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      entry.label.toLowerCase().includes(q) ||
      entry.keywords?.some((kw) => kw.toLowerCase().includes(q))
    );
  });

  const handleSelect = useCallback(
    (to: string) => {
      setOpen(false);
      navigate({ to });
    },
    [navigate],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0">
        <Command>
          <CommandInput
            ref={inputRef}
            placeholder="Search pages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {filtered.map((entry) => {
                const Icon = entry.icon;
                return (
                  <CommandItem
                    key={entry.to}
                    onMouseDown={() => handleSelect(entry.to)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSelect(entry.to);
                    }}
                    tabIndex={0}
                  >
                    <Icon className="mr-2 size-4" />
                    <span>{entry.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
