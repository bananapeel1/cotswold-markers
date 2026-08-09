import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockAuth, mockDb, mockDoc } from "./setup";

const mockIsFirestoreAvailable = vi.fn(() => false);

vi.mock("@/lib/firebase", () => ({
  getAdminAuth: () => mockAuth,
  getDb: () => mockDb,
  isFirestoreAvailable: () => mockIsFirestoreAvailable(),
}));

import { GET, POST, PUT, DELETE } from "@/app/api/routes/route";

function makeRequest(
  method: string,
  opts?: { cookie?: string; body?: Record<string, unknown>; query?: string }
): NextRequest {
  const url = `http://localhost:3000/api/routes${opts?.query ?? ""}`;
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

function grantAdmin() {
  mockAuth.verifySessionCookie.mockResolvedValue({
    uid: "admin-uid",
    email: "admin@example.com",
    name: "Admin",
  } as never);
  mockIsFirestoreAvailable.mockReturnValue(true);
  // allowedAdmins doc lookup + generic doc reads
  mockDoc.exists = true;
  mockDoc.data.mockReturnValue({});
}

describe("GET /api/routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirestoreAvailable.mockReturnValue(false);
    mockDoc.exists = false;
  });

  it("returns routes and accessible sections from the JSON fallback", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.routes)).toBe(true);
    expect(data.routes.length).toBeGreaterThan(40);
    expect(Array.isArray(data.accessibleSections)).toBe(true);
    const route = data.routes[0];
    expect(route.slug).toBeTruthy();
    expect(["easy", "moderate", "challenging"]).toContain(route.difficulty);
  });
});

describe("auth gating on /api/routes mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirestoreAvailable.mockReturnValue(false);
    mockDoc.exists = false;
    mockAuth.verifySessionCookie.mockRejectedValue(
      new Error("Invalid session cookie")
    );
  });

  it("POST returns 401 without auth", async () => {
    const res = await POST(
      makeRequest("POST", { body: { route: { name: "X" } } })
    );
    expect(res.status).toBe(401);
  });

  it("PUT returns 401 without auth", async () => {
    const res = await PUT(
      makeRequest("PUT", { body: { route: { id: "route-x" } } })
    );
    expect(res.status).toBe(401);
  });

  it("DELETE returns 401 without auth", async () => {
    const res = await DELETE(
      makeRequest("DELETE", { query: "?id=route-x" })
    );
    expect(res.status).toBe(401);
  });
});

describe("validation on /api/routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    grantAdmin();
  });

  it("rejects a route with an invalid difficulty", async () => {
    const res = await POST(
      makeRequest("POST", {
        cookie: "valid",
        body: {
          route: {
            slug: "bad-route",
            name: "Bad Route",
            latitude: 51.75,
            longitude: -2.07,
            distanceMiles: 3,
            difficulty: "impossible",
            source: "Test",
            section: "middle",
            area: "Painswick",
          },
        },
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
    expect(data.issues.join(" ")).toContain("difficulty");
  });

  it("rejects a route with out-of-corridor coordinates", async () => {
    const res = await POST(
      makeRequest("POST", {
        cookie: "valid",
        body: {
          route: {
            slug: "paris-loop",
            name: "Paris Loop",
            latitude: 48.85,
            longitude: 2.35,
            distanceMiles: 3,
            difficulty: "easy",
            source: "Test",
            section: "north",
            area: "Paris",
          },
        },
      })
    );
    expect(res.status).toBe(400);
  });
});
