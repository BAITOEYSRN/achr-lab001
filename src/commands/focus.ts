import { writeSuccess } from "../lib/output.js";

export const FOCUS_DURATION_SECONDS = 1500;
export const FOCUS_TICK_INTERVAL_MS = 60_000;

export interface FocusOptions {
  durationSeconds?: number;
  tickIntervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
  signal?: AbortSignal;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function runFocus(options: FocusOptions = {}): Promise<number> {
  const durationSeconds = options.durationSeconds ?? FOCUS_DURATION_SECONDS;
  const tickIntervalMs = options.tickIntervalMs ?? FOCUS_TICK_INTERVAL_MS;
  const sleep = options.sleep ?? defaultSleep;
  const signal = options.signal;

  let cancelled = false;

  const onAbort = (): void => {
    cancelled = true;
  };

  if (signal) {
    if (signal.aborted) {
      writeSuccess("Focus session cancelled.");
      return 0;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }

  const endTime = Date.now() + durationSeconds * 1000;
  let nextTickAt = Date.now() + tickIntervalMs;

  while (Date.now() < endTime) {
    if (cancelled || signal?.aborted) {
      writeSuccess("Focus session cancelled.");
      return 0;
    }

    const now = Date.now();
    if (now >= nextTickAt) {
      const remainingMs = Math.max(0, endTime - now);
      const remainingMinutes = Math.ceil(remainingMs / 60_000);
      writeSuccess(`Focus: ${remainingMinutes} minute(s) remaining...`);
      nextTickAt = now + tickIntervalMs;
    }

    const waitMs = Math.min(100, endTime - now, nextTickAt - now);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
  }

  if (cancelled || signal?.aborted) {
    writeSuccess("Focus session cancelled.");
    return 0;
  }

  writeSuccess("Focus session complete! Well done.");
  process.stdout.write("\u0007");
  return 0;
}

export function registerFocusInterruptHandler(
  onInterrupt: () => void,
): () => void {
  const handler = (): void => {
    onInterrupt();
  };
  process.on("SIGINT", handler);
  return () => process.off("SIGINT", handler);
}
