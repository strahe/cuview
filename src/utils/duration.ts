export const parseGoDurationSeconds = (
  value: string | null | undefined,
): number => {
  if (!value) return 0;

  const pattern = /(\d+(?:\.\d+)?)(ns|us|\u00B5s|ms|s|m|h)/g;
  const unitToSeconds = {
    ns: 1e-9,
    us: 1e-6,
    "\u00B5s": 1e-6,
    ms: 1e-3,
    s: 1,
    m: 60,
    h: 3600,
  } as const;

  let totalSeconds = 0;
  let match = pattern.exec(value);
  while (match !== null) {
    const amountText = match[1];
    const unitText = match[2] as keyof typeof unitToSeconds | undefined;
    if (!amountText || !unitText) {
      continue;
    }

    const amount = Number.parseFloat(amountText);
    const unitSeconds = unitToSeconds[unitText];

    if (!Number.isNaN(amount) && unitSeconds !== undefined) {
      totalSeconds += amount * unitSeconds;
    }
    match = pattern.exec(value);
  }

  return totalSeconds;
};
