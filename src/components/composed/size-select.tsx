import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateSizeOptions } from "@/utils/market";

interface SizeSelectProps {
  value: number;
  onChange: (bytes: number) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  className?: string;
}

export function SizeSelect({
  value,
  onChange,
  id,
  name,
  disabled,
  "aria-invalid": ariaInvalid,
  onBlur,
  className,
}: SizeSelectProps) {
  const options = useMemo(() => generateSizeOptions(), []);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Select
      disabled={disabled}
      name={name}
      value={String(value)}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger
        aria-invalid={ariaInvalid}
        className={className}
        id={id}
        onBlur={onBlur}
      >
        <SelectValue placeholder="Select size">
          {selectedOption?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
