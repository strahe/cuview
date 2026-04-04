import type { ComponentProps, ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AppFieldProps {
  label?: ReactNode;
  htmlFor?: string;
  description?: ReactNode;
  errors?: unknown[];
  children: ReactNode;
  className?: string;
  required?: boolean;
}

interface AppCheckboxFieldProps {
  control: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  errors?: unknown[];
  className?: string;
  htmlFor?: string;
  labelId?: string;
}

export interface FormFieldBinding {
  form: {
    state: {
      submissionAttempts: number;
    };
  };
  handleBlur: (...args: any[]) => void;
  handleChange: (updater: any) => void;
  name: string;
  state: {
    meta: {
      errors?: unknown[];
      isBlurred?: boolean;
      isTouched?: boolean;
    };
    value: unknown;
  };
}

interface BoundFieldProps {
  field: FormFieldBinding;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  required?: boolean;
}

interface TextFieldProps
  extends BoundFieldProps,
    Omit<
      ComponentProps<typeof Input>,
      "aria-invalid" | "id" | "name" | "onBlur" | "onChange" | "value"
    > {
  id?: string;
  inputClassName?: string;
  parseValue?: (value: string) => unknown;
  formatValue?: (value: unknown) => string;
}

interface TextareaFieldProps
  extends BoundFieldProps,
    Omit<
      ComponentProps<typeof Textarea>,
      "aria-invalid" | "id" | "name" | "onBlur" | "onChange" | "value"
    > {
  id?: string;
  textareaClassName?: string;
  parseValue?: (value: string) => unknown;
  formatValue?: (value: unknown) => string;
}

interface CheckboxFieldProps
  extends BoundFieldProps,
    Omit<
      ComponentProps<typeof Checkbox>,
      | "aria-invalid"
      | "checked"
      | "className"
      | "id"
      | "name"
      | "onBlur"
      | "onCheckedChange"
    > {
  id?: string;
  controlClassName?: string;
}

interface SwitchFieldProps
  extends BoundFieldProps,
    Omit<
      ComponentProps<typeof Switch>,
      | "aria-invalid"
      | "checked"
      | "className"
      | "id"
      | "name"
      | "onBlur"
      | "onCheckedChange"
    > {
  id?: string;
  controlClassName?: string;
}

interface SelectFieldProps
  extends BoundFieldProps,
    Omit<
      ComponentProps<typeof Select>,
      "children" | "disabled" | "name" | "onValueChange" | "value"
    > {
  id?: string;
  children: ReactNode;
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
  parseValue?: (value: string) => unknown;
  formatValue?: (value: unknown) => string;
  disabled?: boolean;
}

export function getFieldErrorMessages(errors: unknown[] | undefined) {
  return (errors ?? []).flatMap((error) => {
    if (!error) {
      return [];
    }

    if (typeof error === "string") {
      return [error];
    }

    if (
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return [error.message];
    }

    return [];
  });
}

export function getFormFieldErrors(field: FormFieldBinding) {
  return getFieldErrorMessages(field.state.meta.errors);
}

export function isFormFieldInvalid(field: FormFieldBinding) {
  return (
    (field.state.meta.isBlurred ||
      field.form.state.submissionAttempts > 0 ||
      field.state.meta.isTouched) &&
    getFormFieldErrors(field).length > 0
  );
}

function toFieldErrorObjects(errors: unknown[] | undefined) {
  return getFieldErrorMessages(errors).map((message) => ({ message }));
}

function getFieldIdentifier(field: FormFieldBinding, id?: string) {
  return id ?? field.name;
}

function getTextFieldValue(
  value: unknown,
  formatValue?: (value: unknown) => string,
) {
  if (formatValue) {
    return formatValue(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? "" : String(value);
  }

  return value == null ? "" : String(value);
}

export function AppField({
  label,
  htmlFor,
  description,
  errors,
  children,
  className,
  required = false,
}: AppFieldProps) {
  const fieldErrors = toFieldErrorObjects(errors);

  return (
    <Field
      className={cn("gap-1.5", className)}
      data-invalid={fieldErrors.length > 0 || undefined}
    >
      {label ? (
        <div className="flex items-center gap-1">
          <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
          {required ? (
            <span aria-hidden="true" className="text-sm font-medium">
              *
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError errors={fieldErrors} />
    </Field>
  );
}

export function AppCheckboxField({
  control,
  label,
  description,
  errors,
  className,
  htmlFor,
  labelId,
}: AppCheckboxFieldProps) {
  const fieldErrors = toFieldErrorObjects(errors);

  return (
    <Field
      className={cn(className)}
      data-invalid={fieldErrors.length > 0 || undefined}
      orientation="horizontal"
    >
      {control}
      <FieldContent>
        <FieldLabel
          className="font-normal leading-normal"
          htmlFor={htmlFor}
          id={labelId}
        >
          {label}
        </FieldLabel>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
        <FieldError errors={fieldErrors} />
      </FieldContent>
    </Field>
  );
}

export function AppSwitchField(props: AppCheckboxFieldProps) {
  return <AppCheckboxField {...props} />;
}

export function TextField({
  field,
  label,
  description,
  className,
  required,
  id,
  inputClassName,
  parseValue,
  formatValue,
  ...props
}: TextFieldProps) {
  const invalid = isFormFieldInvalid(field);

  return (
    <AppField
      className={className}
      description={description}
      errors={invalid ? getFormFieldErrors(field) : undefined}
      htmlFor={getFieldIdentifier(field, id)}
      label={label}
      required={required}
    >
      <Input
        {...props}
        aria-invalid={invalid || undefined}
        className={inputClassName}
        id={getFieldIdentifier(field, id)}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(event) =>
          field.handleChange(
            parseValue ? parseValue(event.target.value) : event.target.value,
          )
        }
        value={getTextFieldValue(field.state.value, formatValue)}
      />
    </AppField>
  );
}

export function TextareaField({
  field,
  label,
  description,
  className,
  required,
  id,
  textareaClassName,
  parseValue,
  formatValue,
  ...props
}: TextareaFieldProps) {
  const invalid = isFormFieldInvalid(field);

  return (
    <AppField
      className={className}
      description={description}
      errors={invalid ? getFormFieldErrors(field) : undefined}
      htmlFor={getFieldIdentifier(field, id)}
      label={label}
      required={required}
    >
      <Textarea
        {...props}
        aria-invalid={invalid || undefined}
        className={textareaClassName}
        id={getFieldIdentifier(field, id)}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(event) =>
          field.handleChange(
            parseValue ? parseValue(event.target.value) : event.target.value,
          )
        }
        value={getTextFieldValue(field.state.value, formatValue)}
      />
    </AppField>
  );
}

export function CheckboxField({
  field,
  label,
  description,
  className,
  id,
  controlClassName,
  ...props
}: CheckboxFieldProps) {
  const invalid = isFormFieldInvalid(field);
  const identifier = getFieldIdentifier(field, id);

  return (
    <AppCheckboxField
      className={className}
      control={
        <Checkbox
          {...props}
          aria-labelledby={`${identifier}-label`}
          aria-invalid={invalid || undefined}
          checked={Boolean(field.state.value)}
          className={controlClassName}
          id={identifier}
          name={field.name}
          onBlur={field.handleBlur}
          onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
        />
      }
      description={description}
      errors={invalid ? getFormFieldErrors(field) : undefined}
      htmlFor={identifier}
      label={label}
      labelId={`${identifier}-label`}
    />
  );
}

export function SwitchField({
  field,
  label,
  description,
  className,
  id,
  controlClassName,
  ...props
}: SwitchFieldProps) {
  const invalid = isFormFieldInvalid(field);
  const identifier = getFieldIdentifier(field, id);

  return (
    <AppSwitchField
      className={className}
      control={
        <Switch
          {...props}
          aria-labelledby={`${identifier}-label`}
          aria-invalid={invalid || undefined}
          checked={Boolean(field.state.value)}
          className={controlClassName}
          id={identifier}
          name={field.name}
          onBlur={field.handleBlur}
          onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
        />
      }
      description={description}
      errors={invalid ? getFormFieldErrors(field) : undefined}
      htmlFor={identifier}
      label={label}
      labelId={`${identifier}-label`}
    />
  );
}

export function SelectField({
  field,
  label,
  description,
  className,
  required,
  id,
  children,
  placeholder,
  triggerClassName,
  contentClassName,
  parseValue,
  formatValue,
  disabled,
  ...props
}: SelectFieldProps) {
  const invalid = isFormFieldInvalid(field);
  const identifier = getFieldIdentifier(field, id);
  const value = getTextFieldValue(field.state.value, formatValue);

  return (
    <AppField
      className={className}
      description={description}
      errors={invalid ? getFormFieldErrors(field) : undefined}
      htmlFor={identifier}
      label={label}
      required={required}
    >
      <Select
        {...props}
        disabled={disabled}
        name={field.name}
        onValueChange={(nextValue) =>
          field.handleChange(
            parseValue ? parseValue(String(nextValue)) : String(nextValue),
          )
        }
        value={value}
      >
        <SelectTrigger
          aria-invalid={invalid || undefined}
          className={triggerClassName}
          id={identifier}
          onBlur={field.handleBlur}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={contentClassName}>{children}</SelectContent>
      </Select>
    </AppField>
  );
}

export {
  FieldGroup as AppFieldGroup,
  FieldLegend as AppFormLegend,
  FieldSeparator as AppFormSeparator,
  FieldSet as AppFormSection,
};

export function AppFormActions({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}
