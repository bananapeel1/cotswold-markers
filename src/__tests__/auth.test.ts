import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockAuth, mockDb, mockDoc } from "./setup";

// Mock isFirestoreAvailable to return true by default for auth tests
vi.mock("@/lib/firebase", () => ({
  getAdminAuth: () => mockAuth,
  getDb: () => mockDb,
  isFirestoreAvailable: vi.fn(() => true),
}));

import { verifySession, verifyAdmin } from "@/lib/auth";

function makeRequest(cookie?: string): NextRequest {
  const url = "http://localhost:3000/api/test";
  const req = new NextRequest(url);
  if (cookie) {
    // NextRequest cookies are read-only, so build with headers
    return new NextRequest(url, {
      headers: { cookie: `__session=${cookie}` },
    });
  }
  return req;
}

describe("verifySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no session cookie is present", async () => {
    const req = makeRequest();
    const result = await verifySession(req);
    expect(result).toBeNull();
  });

  it("returns null for an invalid session cookie", async () => {
    mockAuth.verifySessionCookie.mockRejectedValueOnce(
      new Error("Invalid session")
    );
    const req = makeRequest("bad-cookie");
    const result = await verifySession(req);
    expect(result).toBeNull();
  });

  it("returns session info for a valid cookie", async () => {
    mockAuth.verifySessionCookie.mockResolvedValueOnce({
      uid: "user-123",
      email: "user@example.com",
      name: "Test User",
    });
    const req = makeRequest("valid-cookie");
    const result = await verifySession(req);
    expect(result).toEqual({
      authenticated: true,
      uid: "user-123",
      email: "user@example.com",
      name: "Test User",
    });
  });
});

describe("verifyAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when session is missing", async () => {
    const req = makeRequest();
    const result = await verifyAdmin(req);
    expect(result).toBeNull();
  });

  it("returns null for a non-admin user", async () => {
    mockAuth.verifySessionCookie.mockResolvedValueOnce({
      uid: "user-123",
      email: "user@example.com",
      name: "Regular User",
    });
    // Admin doc does not exist
    mockDoc.exists = false;
    const result = await verifyAdmin(makeRequest("valid-cookie"));
    expect(result).toBeNull();
  });

  it("returns session for a valid admin user", async () => {
    mockAuth.verifySessionCookie.mockResolvedValueOnce({
      uid: "admin-123",
      email: "admin@example.com",
      name: "Admin User",
    });
    // Admin doc exists
    mockDoc.exists = true;
    const result = await verifyAdmin(makeRequest("valid-cookie"));
    expect(result).toEqual({
      authenticated: true,
      uid: "admin-123",
      email: "admin@example.com",
      name: "Admin User",
    });
    // Reset
    mockDoc.exists = false;
  });

  it("returns null when user has no email", async () => {
    mockAuth.verifySessionCookie.mockResolvedValueOnce({
      uid: "user-no-email",
      email: undefined,
      name: "No Email",
    });
    const result = await verifyAdmin(makeRequest("valid-cookie"));
    expect(result).toBeNull();
  });
});
