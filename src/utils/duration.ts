export const parseGoDurationSeconds = (
  value: string | null | undefined,
): number => {
  if (!value) return 0;

  const pattern = /(\d+(?:\.\d+)?)(ns|us|\u00B5s|ms|s|m|h)/g;
  const unitToSeconds: Record<string, number> = {
    ns: 1e-9,
    us: 1e-6,
    "\u00B5s": 1e-6,
    ms: 1e-3,
    s: 1,
    m: 60,
    h: 3600,
  };

  let totalSeconds = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    const amount = parseFloat(match[1]);
    const unit = match[2];
    const unitSeconds = unitToSeconds[unit];

    if (!Number.isNaN(amount) && unitSeconds) {
      totalSeconds += amount * unitSeconds;
    }
  }

  return totalSeconds;
};
