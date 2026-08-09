import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockAuth, mockDb, mockDoc } from "./setup";

const mockIsFirestoreAvailable = vi.fn(() => false);

vi.mock("@/lib/firebase", () => ({
  getAdminAuth: () => mockAuth,
  getDb: () => mockDb,
  isFirestoreAvailable: () => mockIsFirestoreAvailable(),
  getStorageBucket: () => ({}),
}));

import { GET, POST, DELETE } from "@/app/api/admin/users/route";

function makeRequest(
  method: string,
  opts?: { cookie?: string; body?: Record<string, unknown>; query?: string }
): NextRequest {
  const url = `http://localhost:3000/api/admin/users${opts?.query ?? ""}`;
  const init: RequestInit & { headers: Record<string, string> } = {
    method,
    headers: {} as Record<string, string>,
  };
  if (opts?.cookie) init.headers.cookie = `__session=${opts.cookie}`;
  if (opts?.body) {
    init.headers["content-type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }
  return new NextRequest(url, init);
}

function grantAdmin(email = "admin@example.com") {
  mockAuth.verifySessionCookie.mockResolvedValue({
    uid: "admin-uid",
    email,
    name: "Admin",
  } as never);
  mockIsFirestoreAvailable.mockReturnValue(true);
  mockDoc.exists = true;
  mockDoc.data.mockReturnValue({});
}

describe("auth gating on /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirestoreAvailable.mockReturnValue(false);
    mockDoc.exists = false;
    mockAuth.verifySessionCookie.mockRejectedValue(new Error("invalid"));
  });

  it("GET returns 401 without auth", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("POST returns 401 without auth", async () => {
    const res = await POST(
      makeRequest("POST", { body: { email: "new@example.com" } })
    );
    expect(res.status).toBe(401);
  });

  it("DELETE returns 401 without auth", async () => {
    const res = await DELETE(
      makeRequest("DELETE", { query: "?email=x@example.com" })
    );
    expect(res.status).toBe(401);
  });
});

describe("guards on /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    grantAdmin("admin@example.com");
  });

  it("rejects removing your own admin access", async () => {
    const res = await DELETE(
      makeRequest("DELETE", {
        cookie: "valid",
        query: "?email=admin@example.com",
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(String(data.error).toLowerCase()).toContain("own");
  });

  it("rejects an invalid email on create", async () => {
    const res = await POST(
      makeRequest("POST", { cookie: "valid", body: { email: "not-an-email" } })
    );
    expect(res.status).toBe(400);
  });
});
