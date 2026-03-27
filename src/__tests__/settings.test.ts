import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockAuth, mockDb, mockDoc } from "./setup";

const mockIsFirestoreAvailable = vi.fn(() => false);

vi.mock("@/lib/firebase", () => ({
  getAdminAuth: () => mockAuth,
  getDb: () => mockDb,
  isFirestoreAvailable: () => mockIsFirestoreAvailable(),
}));

import { GET, PUT } from "@/app/api/settings/route";

function makeRequest(
  method: string,
  opts?: { cookie?: string; body?: Record<string, unknown> }
): NextRequest {
  const url = "http://localhost:3000/api/settings";
  const init: RequestInit & { headers: Record<string, string> } = {
    method,
    headers: {} as Record<string, string>,
  };

  if (opts?.cookie) {
    init.headers.cookie = `__session=${opts.cookie}`;
  }
  if (opts?.body) {
    init.headers["content-type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }
  return new NextRequest(url, init);
}

describe("GET /api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirestoreAvailable.mockReturnValue(false);
    mockDoc.exists = false;
  });

  it("returns default settings when Firestore is unavailable", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.appName).toBe("TrailTap");
    expect(data.trailName).toBe("Cotswold Way");
    expect(data.trailLength).toBe("102");
    expect(data.rewardsLive).toBe(false);
  });
});

describe("PUT /api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirestoreAvailable.mockReturnValue(false);
    mockDoc.exists = false;
  });

  it("returns 401 without auth", async () => {
    const req = makeRequest("PUT", {
      body: { settings: { appName: "NewName" } },
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });
});
