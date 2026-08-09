import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { mockAuth, mockDb, mockDoc } from "./setup";

const mockIsFirestoreAvailable = vi.fn(() => false);

vi.mock("@/lib/firebase", () => ({
  getAdminAuth: () => mockAuth,
  getDb: () => mockDb,
  isFirestoreAvailable: () => mockIsFirestoreAvailable(),
  getStorageBucket: () => ({
    file: () => ({
      save: vi.fn(async () => {}),
      makePublic: vi.fn(async () => {}),
    }),
  }),
}));

import { GET, POST } from "@/app/api/admin/audio/route";

function makeRequest(
  method: string,
  opts?: { cookie?: string; body?: Record<string, unknown> }
): NextRequest {
  const url = "http://localhost:3000/api/admin/audio";
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

function grantAdmin() {
  mockAuth.verifySessionCookie.mockResolvedValue({
    uid: "admin-uid",
    email: "admin@example.com",
    name: "Admin",
  } as never);
  mockIsFirestoreAvailable.mockReturnValue(true);
  mockDoc.exists = true;
  mockDoc.data.mockReturnValue({
    id: "story-test",
    title: "A Story",
    body: "Some body text for narration.",
  });
}

const savedKey = process.env.ELEVENLABS_API_KEY;

describe("/api/admin/audio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFirestoreAvailable.mockReturnValue(false);
    mockDoc.exists = false;
    mockAuth.verifySessionCookie.mockRejectedValue(new Error("invalid"));
  });

  afterEach(() => {
    if (savedKey === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = savedKey;
  });

  it("GET returns 401 without auth", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("POST returns 401 without auth", async () => {
    const res = await POST(
      makeRequest("POST", { body: { storyId: "story-test" } })
    );
    expect(res.status).toBe(401);
  });

  it("POST fails clearly when ELEVENLABS_API_KEY is missing", async () => {
    grantAdmin();
    delete process.env.ELEVENLABS_API_KEY;
    const res = await POST(
      makeRequest("POST", { cookie: "valid", body: { storyId: "story-test" } })
    );
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain("ELEVENLABS_API_KEY");
  });
});
