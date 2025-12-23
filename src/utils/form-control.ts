export type FormControlTone = "default" | "error" | "success";
export type FormControlSize = "sm" | "md" | "lg";

interface BaseOptions {
  size?: FormControlSize;
  tone?: FormControlTone;
  disabled?: boolean;
}

interface InputOptions extends BaseOptions {
  withPrefix?: boolean;
  withSuffix?: boolean;
}

const INPUT_SIZE_MAP: Record<FormControlSize, string> = {
  sm: "input-sm",
  md: "input-md",
  lg: "input-lg",
};

const SELECT_SIZE_MAP: Record<FormControlSize, string> = {
  sm: "select-sm",
  md: "select-md",
  lg: "select-lg",
};

const TEXTAREA_SIZE_MAP: Record<FormControlSize, string> = {
  sm: "textarea-sm",
  md: "textarea-md",
  lg: "textarea-lg",
};

const resolveToneClass = (
  tone: FormControlTone | undefined,
  component: "input" | "select" | "textarea",
): string | undefined => {
  if (!tone || tone === "default") return undefined;

  if (tone === "error") {
    return component === "input"
      ? "input-error"
      : component === "select"
        ? "select-error"
        : "textarea-error";
  }

  return component === "input"
    ? "input-success"
    : component === "select"
      ? "select-success"
      : "textarea-success";
};

const mergeClasses = (classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

export const inputClasses = (options: InputOptions = {}): string => {
  const {
    size = "sm",
    tone = "default",
    disabled,
    withPrefix,
    withSuffix,
  } = options;

  return mergeClasses([
    "input input-bordered w-full",
    INPUT_SIZE_MAP[size],
    resolveToneClass(tone, "input"),
    disabled ? "input-disabled" : undefined,
    withPrefix ? "pl-10" : undefined,
    withSuffix ? "pr-10" : undefined,
  ]);
};

export const selectClasses = (options: BaseOptions = {}): string => {
  const { size = "sm", tone = "default", disabled } = options;

  return mergeClasses([
    "select select-bordered w-full",
    SELECT_SIZE_MAP[size],
    resolveToneClass(tone, "select"),
    disabled ? "select-disabled" : undefined,
  ]);
};

export const textareaClasses = (options: BaseOptions = {}): string => {
  const { size = "sm", tone = "default", disabled } = options;

  return mergeClasses([
    "textarea textarea-bordered w-full",
    TEXTAREA_SIZE_MAP[size],
    resolveToneClass(tone, "textarea"),
    disabled ? "textarea-disabled" : undefined,
  ]);
};
