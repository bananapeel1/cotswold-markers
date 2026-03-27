import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockAuth, mockDb, mockDoc } from "./setup";

const mockIsFirestoreAvailable = vi.fn(() => false);

vi.mock("@/lib/firebase", () => ({
  getAdminAuth: () => mockAuth,
  getDb: () => mockDb,
  isFirestoreAvailable: () => mockIsFirestoreAvailable(),
}));

vi.mock("@/data/stories", () => ({
  getStories: vi.fn(async () => [
    {
      id: "story-roman-villa",
      title: "The Roman Villa",
      summary: "Ancient ruins near the trail",
      body: "Full body text here",
      category: "history",
      imageUrl: null,
      attribution: null,
      markerIds: ["cw-01-chipping-campden"],
    },
    {
      id: "story-wool-trade",
      title: "The Wool Trade",
      summary: "Medieval commerce along the Cotswolds",
      body: "Full body text here",
      category: "local",
      imageUrl: null,
      attribution: null,
      markerIds: ["cw-02-broadway"],
    },
  ]),
}));

vi.mock("@/lib/auth", () => ({
  verifyAdmin: vi.fn(async () => false),
}));

import { GET, POST, PUT, DELETE } from "@/app/api/stories/route";
import { verifyAdmin } from "@/lib/auth";

function makeRequest(
  method: string,
  opts?: { body?: Record<string, unknown>; query?: string }
): NextRequest {
  const url = `http://localhost:3000/api/stories${opts?.query || ""}`;
  const init: RequestInit & { headers: Record<string, string> } = {
    method,
    headers: {} as Record<string, string>,
  };

  if (opts?.body) {
    init.headers["content-type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }
  return new NextRequest(url, init);
}

describe("GET /api/stories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array of stories", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
  });

  it("returns stories with expected shape", async () => {
    const res = await GET();
    const data = await res.json();
    const story = data[0];
    expect(story).toHaveProperty("id");
    expect(story).toHaveProperty("title");
    expect(story).toHaveProperty("summary");
    expect(story).toHaveProperty("body");
    expect(story).toHaveProperty("category");
    expect(story).toHaveProperty("markerIds");
    expect(Array.isArray(story.markerIds)).toBe(true);
  });
});

describe("POST /api/stories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without auth", async () => {
    const req = makeRequest("POST", {
      body: { story: { title: "New Story" } },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when title is missing (with auth)", async () => {
    vi.mocked(verifyAdmin).mockResolvedValueOnce(true);
    const req = makeRequest("POST", {
      body: { story: {} },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Title required");
  });
});

describe("PUT /api/stories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without auth", async () => {
    const req = makeRequest("PUT", {
      body: { story: { id: "story-roman-villa", title: "Updated" } },
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });
});

describe("DELETE /api/stories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without auth", async () => {
    const req = makeRequest("DELETE", { query: "?id=story-roman-villa" });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });
});
