type FieldValidatorContext = {
  form: { state: { values: Record<string, unknown> } };
};

export const useWatermarkValidators = () => {
  const validateNonNegativeNumber = (
    value: string,
    label: string,
  ): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return `${label} is required`;
    const numeric = Number(trimmed);
    if (Number.isNaN(numeric)) return `${label} must be a valid number`;
    if (numeric < 0) return `${label} cannot be negative`;
    return undefined;
  };

  const compareWatermarks = (
    lowValue: string,
    highValue: string,
    lowLabel: string,
    highLabel: string,
  ): string | undefined => {
    const lowNumeric = Number(lowValue.trim());
    const highNumeric = Number(highValue.trim());
    if (
      !Number.isNaN(lowNumeric) &&
      !Number.isNaN(highNumeric) &&
      highNumeric < lowNumeric
    ) {
      return `${highLabel} must be greater than or equal to ${lowLabel}`;
    }
    return undefined;
  };

  const validateWatermarkPair = (
    lowValue: string,
    highValue: string,
    lowLabel: string,
    highLabel: string,
  ): string | null => {
    const lowError = validateNonNegativeNumber(lowValue, lowLabel);
    if (lowError) return lowError;
    const highError = validateNonNegativeNumber(highValue, highLabel);
    if (highError) return highError;
    const comparisonError = compareWatermarks(
      lowValue,
      highValue,
      lowLabel,
      highLabel,
    );
    return comparisonError ?? null;
  };

  const createRequiredStringValidator = (label: string) => ({
    onChange: ({ value }: { value: string }) =>
      value.trim() ? undefined : `${label} is required`,
  });

  const createNonNegativeNumberValidator = (label: string) => ({
    onChange: ({ value }: { value: string }) =>
      validateNonNegativeNumber(value, label),
  });

  const createHighWatermarkValidator = (
    label: string,
    minField: string,
    minLabel: string,
  ) => ({
    onChangeListenTo: [minField],
    onChange: ({
      value,
      fieldApi,
    }: {
      value: string;
      fieldApi: FieldValidatorContext;
    }) => {
      const baseError = validateNonNegativeNumber(value, label);
      if (baseError) return baseError;
      const minRaw = (fieldApi.form.state.values[minField] ?? "") as string;
      const comparisonError = compareWatermarks(minRaw, value, minLabel, label);
      return comparisonError;
    },
  });

  return {
    validateNonNegativeNumber,
    compareWatermarks,
    validateWatermarkPair,
    createRequiredStringValidator,
    createNonNegativeNumberValidator,
    createHighWatermarkValidator,
  };
};
