import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FOCUS_DURATION_SECONDS,
  registerFocusInterruptHandler,
  runFocus,
} from "../src/commands/focus.js";

describe("focus command", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("completes after the configured duration", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((line?: unknown) => {
      lines.push(String(line));
    });
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const promise = runFocus({
      durationSeconds: 3,
      tickIntervalMs: 1_000,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    });

    await vi.advanceTimersByTimeAsync(4_000);
    const code = await promise;

    expect(code).toBe(0);
    expect(lines).toContain("Focus session complete! Well done.");
    expect(writeSpy).toHaveBeenCalledWith("\u0007");
  });

  it("completes after default 1500 second duration", async () => {
    expect(FOCUS_DURATION_SECONDS).toBe(1500);

    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((line?: unknown) => {
      lines.push(String(line));
    });
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const promise = runFocus({
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    });

    await vi.advanceTimersByTimeAsync(1_500_000);
    const code = await promise;

    expect(code).toBe(0);
    expect(lines).toContain("Focus session complete! Well done.");
  });

  it("emits minute remaining ticks", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((line?: unknown) => {
      lines.push(String(line));
    });
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const promise = runFocus({
      durationSeconds: 125,
      tickIntervalMs: 60_000,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    });

    await vi.advanceTimersByTimeAsync(130_000);
    await promise;

    expect(lines.some((line) => line.includes("minute(s) remaining"))).toBe(true);
  });

  it("cancels when aborted via signal", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((line?: unknown) => {
      lines.push(String(line));
    });

    const controller = new AbortController();
    controller.abort();

    const code = await runFocus({
      durationSeconds: FOCUS_DURATION_SECONDS,
      signal: controller.signal,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    });

    expect(code).toBe(0);
    expect(lines).toContain("Focus session cancelled.");
  });

  it("cancels when SIGINT is received via registerFocusInterruptHandler", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((line?: unknown) => {
      lines.push(String(line));
    });

    const controller = new AbortController();
    const cleanup = registerFocusInterruptHandler(() => {
      controller.abort();
    });

    try {
      const promise = runFocus({
        durationSeconds: 120,
        tickIntervalMs: 60_000,
        signal: controller.signal,
        sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      });

      await vi.advanceTimersByTimeAsync(1_000);
      process.emit("SIGINT");
      await vi.advanceTimersByTimeAsync(1_000);

      const code = await promise;

      expect(code).toBe(0);
      expect(lines).toContain("Focus session cancelled.");
    } finally {
      cleanup();
    }
  });
});
