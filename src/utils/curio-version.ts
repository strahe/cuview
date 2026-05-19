interface CurioVersionParts {
  major: number;
  minor: number;
  patch: number;
}

export function normalizeCurioVersion(version: string): string {
  const trimmed = version.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith("v") ? trimmed : `v${trimmed}`;
}

export function getCurioVersionSummary(version: string): string {
  const normalized = normalizeCurioVersion(version);
  const buildMetadataIndex = normalized.indexOf("+");

  return buildMetadataIndex === -1
    ? normalized
    : normalized.slice(0, buildMetadataIndex);
}

function parseCurioVersion(version: string): CurioVersionParts | null {
  const normalized = normalizeCurioVersion(version);
  const match = /^v(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(normalized);

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function isCurioVersionAtLeast(
  version: string | null | undefined,
  target: string,
): boolean {
  if (!version) {
    return false;
  }

  const currentParts = parseCurioVersion(version);
  const targetParts = parseCurioVersion(target);

  if (!currentParts || !targetParts) {
    return false;
  }

  if (currentParts.major !== targetParts.major) {
    return currentParts.major > targetParts.major;
  }

  if (currentParts.minor !== targetParts.minor) {
    return currentParts.minor > targetParts.minor;
  }

  return currentParts.patch >= targetParts.patch;
}
