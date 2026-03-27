import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb } from "./setup";

const mockIsFirestoreAvailable = vi.fn(() => false);

vi.mock("@/lib/firebase", () => ({
  getDb: () => mockDb,
  isFirestoreAvailable: () => mockIsFirestoreAvailable(),
}));

// We need to reset the module-level cache between tests.
// The community route uses module-scoped cachedStats / cacheTimestamp.
// We re-import fresh for each describe block.

describe("GET /api/community", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirestoreAvailable.mockReturnValue(false);
  });

  it("returns zeros when Firestore is unavailable", async () => {
    // Dynamic import to get a fresh copy
    const { GET } = await import("@/app/api/community/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      totalScans: 0,
      totalWalkers: 0,
      activeNow: 0,
      completionsThisMonth: 0,
    });
  });

  it("returns cached data on second call within TTL", async () => {
    mockIsFirestoreAvailable.mockReturnValue(true);

    // Set up mock Firestore responses
    const mockCountsDoc = { exists: true, data: () => ({ "cw-01": 5, "cw-02": 3 }) };
    const mockUsersSnapshot = {
      size: 2,
      forEach: vi.fn(),
    };

    mockDb.collection.mockImplementation((name: string) => {
      if (name === "scanCounts") {
        return {
          doc: vi.fn(() => ({
            get: vi.fn(async () => mockCountsDoc),
          })),
        };
      }
      if (name === "users") {
        return {
          get: vi.fn(async () => mockUsersSnapshot),
        };
      }
      return { doc: vi.fn(() => ({ get: vi.fn(async () => ({ exists: false, data: () => ({}) })) })) };
    });

    // Use a unique import to get fresh module state
    vi.resetModules();
    // Re-mock after reset
    vi.doMock("@/lib/firebase", () => ({
      getDb: () => mockDb,
      isFirestoreAvailable: () => mockIsFirestoreAvailable(),
    }));
    const { GET } = await import("@/app/api/community/route");

    // First call - hits Firestore
    const res1 = await GET();
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.totalScans).toBe(8);
    expect(data1.totalWalkers).toBe(2);

    // Second call - should use cache (collection should not be called again)
    const callCount = mockDb.collection.mock.calls.length;
    const res2 = await GET();
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2).toEqual(data1);
    // collection should not have been called again
    expect(mockDb.collection.mock.calls.length).toBe(callCount);
  });
});
