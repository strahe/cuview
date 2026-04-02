import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  attoFilToFilPerTiBPerMonth,
  filToAttoFilPerGiBPerEpoch,
} from "@/utils/market";

interface FilPriceInputProps {
  /** Stored value in attoFIL/GiB/Epoch */
  value: number;
  /** Called with the new attoFIL/GiB/Epoch value */
  onChange: (attoFilPerGiBPerEpoch: number) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  className?: string;
}

export function FilPriceInput({
  value,
  onChange,
  id,
  name,
  disabled,
  "aria-invalid": ariaInvalid,
  onBlur,
  className,
}: FilPriceInputProps) {
  const formattedValue = attoFilToFilPerTiBPerMonth(value);
  const [inputValue, setInputValue] = useState(formattedValue);
  const [lastSyncedValue, setLastSyncedValue] = useState(value);

  if (lastSyncedValue !== value) {
    setLastSyncedValue(value);
    setInputValue(formattedValue);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setInputValue(nextValue);

    if (nextValue === "") {
      setLastSyncedValue(0);
      onChange(0);
      return;
    }

    const parsedValue = filToAttoFilPerGiBPerEpoch(nextValue);
    if (parsedValue !== null) {
      setLastSyncedValue(parsedValue);
      onChange(parsedValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setInputValue(attoFilToFilPerTiBPerMonth(value));
    onBlur?.(e);
  };

  return (
    <div className={className}>
      <InputGroup>
        <InputGroupInput
          aria-invalid={ariaInvalid}
          disabled={disabled}
          id={id}
          name={name}
          onBlur={handleBlur}
          type="number"
          step="any"
          min={0}
          value={inputValue}
          onChange={handleChange}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>FIL/TiB/Month</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {value.toLocaleString()} attoFIL/GiB/Epoch
      </p>
    </div>
  );
}
