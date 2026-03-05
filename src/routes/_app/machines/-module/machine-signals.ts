import type { MachineSummary } from "@/types/machine";

export const OFFLINE_THRESHOLD_SECONDS = 60;

export const splitCommaValues = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

export const parseDurationSeconds = (value: string): number | null => {
  let totalSeconds = 0;
  let hasMatch = false;
  const matches = value.matchAll(/(\d+(?:\.\d+)?)(h|ms|µs|μs|us|ns|m|s)/g);

  for (const match of matches) {
    const amount = Number.parseFloat(match[1] ?? "0");
    const unit = match[2];
    if (!Number.isFinite(amount)) continue;
    hasMatch = true;
    if (unit === "h") totalSeconds += amount * 60 * 60;
    else if (unit === "m") totalSeconds += amount * 60;
    else if (unit === "s") totalSeconds += amount;
    else if (unit === "ms") totalSeconds += amount / 1_000;
    else if (unit === "µs" || unit === "μs" || unit === "us") {
      totalSeconds += amount / 1_000_000;
    } else if (unit === "ns") totalSeconds += amount / 1_000_000_000;
  }

  return hasMatch ? totalSeconds : null;
};

type MachineSignalInput = Pick<
  MachineSummary,
  "SinceContact" | "Unschedulable" | "Restarting" | "RestartRequest"
>;

export const getMachineSignals = (machine: MachineSignalInput) => {
  const contactSeconds = parseDurationSeconds(machine.SinceContact);
  const offline =
    contactSeconds !== null && contactSeconds > OFFLINE_THRESHOLD_SECONDS;
  const restarting = Boolean(machine.Restarting);
  const restartPending = Boolean(machine.RestartRequest) && !restarting;
  const unschedulable = machine.Unschedulable;
  const online = !offline && !unschedulable;
  const hasAlert = offline || unschedulable || restarting || restartPending;

  return {
    online,
    offline,
    unschedulable,
    restarting,
    restartPending,
    hasAlert,
  };
};
