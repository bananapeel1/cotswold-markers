import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockAuth, mockDb, mockDoc } from "./setup";

const mockIsFirestoreAvailable = vi.fn(() => false);

vi.mock("@/lib/firebase", () => ({
  getAdminAuth: () => mockAuth,
  getDb: () => mockDb,
  isFirestoreAvailable: () => mockIsFirestoreAvailable(),
}));

vi.mock("@/data/markers", () => ({
  getMarkers: vi.fn(async () => [
    { id: "cw-01-chipping-campden", name: "Chipping Campden", shortCode: "CW01" },
    { id: "cw-02-broadway", name: "Broadway Tower", shortCode: "CW02" },
  ]),
  invalidateMarkersCache: vi.fn(),
}));

import { GET, PUT, POST, DELETE } from "@/app/api/markers/route";

function makeRequest(
  method: string,
  opts?: { cookie?: string; body?: Record<string, unknown>; query?: string }
): NextRequest {
  const url = `http://localhost:3000/api/markers${opts?.query || ""}`;
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

describe("GET /api/markers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.exists = false;
  });

  it("returns markers without requiring auth", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
    expect(data[0].id).toBe("cw-01-chipping-campden");
  });
});

describe("PUT /api/markers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.exists = false;
  });

  it("returns 401 without auth", async () => {
    const req = makeRequest("PUT", {
      body: { marker: { id: "cw-01-chipping-campden", name: "Updated" } },
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });
});

describe("POST /api/markers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.exists = false;
  });

  it("returns 401 without auth", async () => {
    const req = makeRequest("POST", {
      body: { marker: { name: "New Marker", shortCode: "CW16" } },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });
});

describe("DELETE /api/markers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.exists = false;
  });

  it("returns 401 without auth", async () => {
    const req = makeRequest("DELETE", { query: "?id=cw-01-chipping-campden" });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });
});
