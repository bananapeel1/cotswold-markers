import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockDb, mockDoc, mockDocRef, mockAuth } from "./setup";

vi.mock("@/lib/firebase", () => ({
  getAdminAuth: () => mockAuth,
  getDb: () => mockDb,
  isFirestoreAvailable: vi.fn(() => false),
  verifyAppCheckToken: vi.fn(async () => true),
}));

vi.mock("@/lib/badges", () => ({
  checkBadges: vi.fn(() => []),
  calculateStreak: vi.fn(() => 0),
}));

import { verifyAppCheckToken } from "@/lib/firebase";
import { POST, GET } from "@/app/api/scan/route";

function makeScanRequest(
  body: Record<string, unknown>,
  ip = "127.0.0.1"
): NextRequest {
  return new NextRequest("http://localhost:3000/api/scan", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      "X-Firebase-AppCheck": "mock-valid-token",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/scan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for missing markerId", async () => {
    const req = makeScanRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("markerId required");
  });

  it("returns 400 for non-string markerId", async () => {
    const req = makeScanRequest({ markerId: 123 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("markerId required");
  });

  it("returns 400 for invalid markerId format", async () => {
    const req = makeScanRequest({ markerId: "INVALID_ID!" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid markerId format");
  });

  it("returns success for valid scan (Firestore unavailable)", async () => {
    const req = makeScanRequest({ markerId: "cw-01-chipping-campden" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.newBadges).toEqual([]);
  });

  it("returns 403 when App Check token is invalid", async () => {
    vi.mocked(verifyAppCheckToken).mockResolvedValueOnce(false);
    const req = makeScanRequest({ markerId: "cw-01-chipping-campden" });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("App Check verification failed");
  });

  it("returns 429 when rate limited", async () => {
    const uniqueIp = `10.0.0.${Math.floor(Math.random() * 255)}`;
    // Send 11 requests from same IP to exceed rate limit of 10
    for (let i = 0; i < 11; i++) {
      const req = makeScanRequest(
        { markerId: "cw-01-chipping-campden" },
        uniqueIp
      );
      const res = await POST(req);
      if (i === 10) {
        expect(res.status).toBe(429);
        const data = await res.json();
        expect(data.error).toContain("Too many requests");
      }
    }
  });
});

describe("GET /api/scan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty data when Firestore is unavailable", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(0);
  });
});
