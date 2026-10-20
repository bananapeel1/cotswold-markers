import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { revalidateTag } from "next/cache";
import {
  readWithFallback,
  guardedRead,
  invalidateContent,
  resetFirestoreBreaker,
  FirestoreSkipped,
} from "@/lib/firestoreRead";

const quotaError = Object.assign(new Error("8 RESOURCE_EXHAUSTED: Quota exceeded."), {
  code: 8,
});

beforeEach(() => {
  resetFirestoreBreaker();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("readWithFallback", () => {
  it("returns the Firestore result and skips the fallback", async () => {
    const fallback = vi.fn(() => ["file"]);
    const result = await readWithFallback("t", "k", async () => ["db"], fallback);
    expect(result).toEqual(["db"]);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("falls back on a quota error and opens the breaker", async () => {
    const firestore = vi.fn().mockRejectedValue(quotaError);
    const fallback = vi.fn(() => ["file"]);

    expect(await readWithFallback("t", "k", firestore, fallback)).toEqual(["file"]);
    expect(firestore).toHaveBeenCalledTimes(1);

    // Breaker open: Firestore is not touched at all.
    expect(await readWithFallback("t", "k", firestore, fallback)).toEqual(["file"]);
    expect(firestore).toHaveBeenCalledTimes(1);
  });

  it("falls back on a slow read without waiting for it", async () => {
    vi.useFakeTimers();
    const firestore = vi.fn(() => new Promise<string[]>(() => {})); // never settles
    const pending = readWithFallback("t", "k", firestore, () => ["file"]);
    await vi.advanceTimersByTimeAsync(2100);
    expect(await pending).toEqual(["file"]);
  });

  it("retries Firestore once the breaker window has passed", async () => {
    vi.useFakeTimers();
    const firestore = vi
      .fn()
      .mockRejectedValueOnce(quotaError)
      .mockResolvedValueOnce(["db"]);

    expect(await readWithFallback("t", "k", firestore, () => ["file"])).toEqual(["file"]);
    await vi.advanceTimersByTimeAsync(61_000);
    expect(await readWithFallback("t", "k", firestore, () => ["file"])).toEqual(["db"]);
  });

  it("does not open the breaker for non-outage errors", async () => {
    const firestore = vi
      .fn()
      .mockRejectedValueOnce(new Error("bad document"))
      .mockResolvedValueOnce(["db"]);

    expect(await readWithFallback("t", "k", firestore, () => ["file"])).toEqual(["file"]);
    expect(await readWithFallback("t", "k", firestore, () => ["file"])).toEqual(["db"]);
  });
});

describe("guardedRead", () => {
  it("passes results through", async () => {
    expect(await guardedRead("x", async () => 42)).toBe(42);
  });

  it("rethrows errors and skips Firestore while the breaker is open", async () => {
    await expect(guardedRead("x", () => Promise.reject(quotaError))).rejects.toBe(quotaError);

    const fn = vi.fn(async () => 1);
    await expect(guardedRead("x", fn)).rejects.toBeInstanceOf(FirestoreSkipped);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("invalidateContent", () => {
  it("expires each tag immediately", () => {
    invalidateContent("markers", "stories");
    expect(revalidateTag).toHaveBeenCalledWith("markers", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("stories", { expire: 0 });
  });

  it("never throws outside a request context", () => {
    vi.mocked(revalidateTag).mockImplementationOnce(() => {
      throw new Error("no request context");
    });
    expect(() => invalidateContent("markers")).not.toThrow();
  });
});
