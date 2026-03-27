import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockAuth, mockDb, mockDoc } from "./setup";

const mockIsFirestoreAvailable = vi.fn(() => false);

vi.mock("@/lib/firebase", () => ({
  getAdminAuth: () => mockAuth,
  getDb: () => mockDb,
  isFirestoreAvailable: () => mockIsFirestoreAvailable(),
}));

import { GET } from "@/app/api/analytics/route";

function makeRequest(cookie?: string): NextRequest {
  const url = "http://localhost:3000/api/analytics";
  if (cookie) {
    return new NextRequest(url, {
      headers: { cookie: `__session=${cookie}` },
    });
  }
  return new NextRequest(url);
}

describe("GET /api/analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirestoreAvailable.mockReturnValue(false);
    mockDoc.exists = false;
  });

  it("returns 401 without auth", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 for non-admin user", async () => {
    mockAuth.verifySessionCookie.mockResolvedValueOnce({
      uid: "user-123",
      email: "user@example.com",
      name: "User",
    });
    // Admin doc does not exist
    mockDoc.exists = false;
    const res = await GET(makeRequest("valid-cookie"));
    expect(res.status).toBe(401);
  });

  it("returns data for admin users when Firestore unavailable", async () => {
    mockAuth.verifySessionCookie.mockResolvedValueOnce({
      uid: "admin-123",
      email: "admin@example.com",
      name: "Admin",
    });
    mockDoc.exists = true;
    mockIsFirestoreAvailable
      .mockReturnValueOnce(true)  // for verifyAdmin -> isFirestoreAvailable
      .mockReturnValueOnce(false); // for the analytics route itself

    const res = await GET(makeRequest("admin-cookie"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalScans).toBe(0);
    expect(data.scansByMarker).toEqual([]);
    // Reset
    mockDoc.exists = false;
  });
});
