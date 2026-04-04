import { Check, ChevronsUpDown } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  AppField,
  type FormFieldBinding,
  getFormFieldErrors,
  isFormFieldInvalid,
} from "./index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** address → friendly name map (same shape as WalletNamesMap) */
export type WalletNamesRecord = Record<string, string>;

interface WalletOption {
  address: string;
  name: string;
}

interface WalletComboboxProps {
  /** Known wallet names (address → friendly name) */
  wallets?: WalletNamesRecord;
  /** Current wallet address value */
  value: string;
  /** Called when the value changes */
  onChange: (value: string) => void;
  /** Called on blur */
  onBlur?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional className for the trigger button */
  className?: string;
  /** Disable the combobox */
  disabled?: boolean;
  /** aria-invalid flag */
  "aria-invalid"?: boolean;
  /** HTML id */
  id?: string;
  /** HTML name */
  name?: string;
}

interface WalletComboboxFieldProps {
  field: FormFieldBinding;
  /** Known wallet names (address → friendly name) */
  wallets?: WalletNamesRecord;
  label?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  required?: boolean;
  id?: string;
  placeholder?: string;
  triggerClassName?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildOptions(names: WalletNamesRecord | undefined): WalletOption[] {
  if (!names) return [];
  return Object.entries(names).map(([address, name]) => ({ address, name }));
}

function formatDisplayValue(address: string, options: WalletOption[]): string {
  if (!address) return "";
  const match = options.find((o) => o.address === address);
  if (match?.name) return `${match.name} (${truncateAddress(address)})`;
  return address;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Standalone WalletCombobox (non-form usage)
// ---------------------------------------------------------------------------

export function WalletCombobox({
  wallets,
  value,
  onChange,
  onBlur,
  placeholder = "Select or enter wallet…",
  className,
  disabled,
  id,
  name: htmlName,
  "aria-invalid": ariaInvalid,
}: WalletComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => buildOptions(wallets), [wallets]);

  const displayValue = formatDisplayValue(value, options);

  const handleSelect = useCallback(
    (selectedAddress: string) => {
      onChange(selectedAddress);
      setSearch("");
      setOpen(false);
      onBlur?.();
    },
    [onChange, onBlur],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && search.trim()) {
        // Only intercept Enter when cmdk has no visible matches (empty state).
        // When matches exist, let cmdk handle Enter to select the highlighted item.
        // cmdk removes non-matching items from the DOM entirely.
        const hasVisibleItems = listRef.current?.querySelector("[cmdk-item]");
        if (!hasVisibleItems) {
          onChange(search.trim());
          setSearch("");
          setOpen(false);
          onBlur?.();
          e.preventDefault();
          e.stopPropagation();
        }
      }
    },
    [search, onChange, onBlur],
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean, eventDetails: { reason: string }) => {
      setOpen(isOpen);
      if (!isOpen) {
        const isFocusLeaving =
          eventDetails.reason === "outside-press" ||
          eventDetails.reason === "focus-out";
        // Commit pending search text only when focus leaves the control
        // AND there are no matching dropdown items (same guard as Enter key).
        // If matches exist, the user was likely filtering — discard partial text.
        if (search.trim() && isFocusLeaving) {
          const hasVisibleItems = listRef.current?.querySelector("[cmdk-item]");
          if (!hasVisibleItems) {
            onChange(search.trim());
          }
        }
        setSearch("");
        // Only fire onBlur when focus actually leaves the control;
        // for escape-key/trigger-press, focus returns to trigger
        if (isFocusLeaving) {
          onBlur?.();
        }
      }
    },
    [search, onChange, onBlur],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            onBlur={() => {
              if (!open) onBlur?.();
            }}
            className={cn(
              "h-9 w-full justify-between font-mono text-xs",
              !value && "text-muted-foreground",
              className,
            )}
            disabled={disabled}
            id={id}
            name={htmlName}
            type="button"
          />
        }
      >
        <span className="truncate">{value ? displayValue : placeholder}</span>
        <ChevronsUpDown className="ml-auto size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command shouldFilter>
          <CommandInput
            aria-label="Search wallets"
            placeholder="Search wallets…"
            value={search}
            onValueChange={setSearch}
            onKeyDown={handleInputKeyDown}
          />
          <CommandList ref={listRef}>
            <CommandEmpty>
              {search.trim() ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-normal"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(search.trim());
                    setSearch("");
                    setOpen(false);
                    onBlur?.();
                  }}
                >
                  Use "<span className="font-mono">{search.trim()}</span>"
                </Button>
              ) : (
                "No wallets found."
              )}
            </CommandEmpty>
            {options.length > 0 && (
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.address}
                    value={`${opt.address} ${opt.name}`}
                    onSelect={() => handleSelect(opt.address)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-3.5 shrink-0",
                        value === opt.address ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex min-w-0 flex-col">
                      {opt.name && <span className="text-xs">{opt.name}</span>}
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {opt.address}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// TanStack Form-bound WalletComboboxField
// ---------------------------------------------------------------------------

export function WalletComboboxField({
  field,
  wallets,
  label,
  description,
  className,
  required,
  id,
  placeholder,
  triggerClassName,
}: WalletComboboxFieldProps) {
  const invalid = isFormFieldInvalid(field);
  const identifier = id ?? field.name;

  return (
    <AppField
      className={className}
      description={description}
      errors={invalid ? getFormFieldErrors(field) : undefined}
      htmlFor={identifier}
      label={label}
      required={required}
    >
      <WalletCombobox
        aria-invalid={invalid || undefined}
        className={triggerClassName}
        id={identifier}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(val) => field.handleChange(val)}
        placeholder={placeholder}
        value={String(field.state.value ?? "")}
        wallets={wallets}
      />
    </AppField>
  );
}
