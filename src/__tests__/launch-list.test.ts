import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";

const mockCreate = vi.fn<(data: Record<string, unknown>) => Promise<void>>(async () => {});
const mockSet = vi.fn<(data: Record<string, unknown>, opts: unknown) => Promise<void>>(async () => {});
const mockDocFn = vi.fn<(id: string) => { create: typeof mockCreate; set: typeof mockSet }>(() => ({
  create: mockCreate,
  set: mockSet,
}));
const mockCollectionFn = vi.fn<(name: string) => { doc: typeof mockDocFn }>(() => ({
  doc: mockDocFn,
}));

vi.mock("@/lib/firebase", () => ({
  getDb: () => ({ collection: mockCollectionFn }),
  isFirestoreAvailable: vi.fn(() => true),
  verifyAppCheckToken: vi.fn(async () => true),
}));

import { isFirestoreAvailable, verifyAppCheckToken } from "@/lib/firebase";
import { POST } from "@/app/api/launch-list/route";
import { launchListDocId } from "@/lib/launchList";
import { launchListSignupSchema } from "@/lib/validation/launchList";
import { SIGNUP_CONSENT_VERSION, momentOn, signupWordsFor, ukDate } from "@/content/launch";

// Each test uses its own IP so the module-level rate limiter doesn't leak between tests
let ipCounter = 0;
function nextIp() {
  ipCounter++;
  return `10.0.0.${ipCounter}`;
}

function makeRequest(body: unknown, ip = nextIp()): NextRequest {
  return new NextRequest("http://localhost:3000/api/launch-list", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      "X-Firebase-AppCheck": "mock-valid-token",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("launchListSignupSchema", () => {
  it("trims and lowercases the email", () => {
    const parsed = launchListSignupSchema.parse({ email: "  Walker@Example.COM " });
    expect(parsed.email).toBe("walker@example.com");
  });

  it("asks for an email when it is empty", () => {
    const result = launchListSignupSchema.safeParse({ email: "  " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Please enter your email address");
  });

  it("leaves both extra boxes unticked unless asked", () => {
    const parsed = launchListSignupSchema.parse({ email: "a@b.co" });
    expect(parsed.notes).toBe(false);
    expect(parsed.leader).toBe(false);
  });

  it("drops a malformed source instead of failing", () => {
    const parsed = launchListSignupSchema.parse({ email: "a@b.co", source: "<script>" });
    expect(parsed.source).toBeUndefined();
  });
});

describe("POST /api/launch-list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stores the sign-up with the words the person agreed to", async () => {
    const res = await POST(makeRequest({ email: " Walker@Example.com", source: "Instagram" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });

    const words = signupWordsFor(momentOn(ukDate()));
    expect(mockDocFn).toHaveBeenCalledWith(launchListDocId("walker@example.com"));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "walker@example.com",
        notes: false,
        leader: false,
        consentText: { button: words.button },
        consentVersion: SIGNUP_CONSENT_VERSION,
        source: "instagram",
        status: "subscribed",
      })
    );
    // Data minimisation: no IP or other request data in the stored record
    const stored = mockCreate.mock.calls[0][0];
    expect(Object.keys(stored).sort()).toEqual(
      ["consentText", "consentVersion", "createdAt", "email", "leader", "moment", "notes", "source", "status"].sort()
    );
  });

  it("records the wording of each box that was ticked", async () => {
    await POST(makeRequest({ email: "leader@example.com", notes: true, leader: true }));
    const stored = mockCreate.mock.calls[0][0] as { notes: boolean; leader: boolean; consentText: Record<string, string> };
    expect(stored.notes).toBe(true);
    expect(stored.leader).toBe(true);
    expect(stored.consentText.notes).toContain("Notes from the");
    expect(stored.consentText.leader).toContain("walk leaders' pack");
  });

  it("writes to the test list everywhere except the live site", async () => {
    await POST(makeRequest({ email: "walker@example.com" }));
    expect(mockCollectionFn).toHaveBeenLastCalledWith("launchListTest");

    vi.stubEnv("VERCEL_ENV", "preview");
    await POST(makeRequest({ email: "walker@example.com" }));
    expect(mockCollectionFn).toHaveBeenLastCalledWith("launchListTest");

    vi.stubEnv("VERCEL_ENV", "production");
    await POST(makeRequest({ email: "walker@example.com" }));
    expect(mockCollectionFn).toHaveBeenLastCalledWith("launchList");
  });

  it("gives the same answer when the email is already on the list", async () => {
    mockCreate.mockRejectedValueOnce(Object.assign(new Error("exists"), { code: 6 }));
    const res = await POST(makeRequest({ email: "walker@example.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("adds a newly ticked box to an existing entry, and never unticks one", async () => {
    mockCreate.mockRejectedValueOnce(Object.assign(new Error("exists"), { code: 6 }));
    const res = await POST(makeRequest({ email: "walker@example.com", notes: true }));
    expect(res.status).toBe(200);
    expect(mockSet).toHaveBeenCalledTimes(1);
    const [data, opts] = mockSet.mock.calls[0];
    expect(opts).toEqual({ merge: true });
    expect(data.notes).toBe(true);
    expect(data).not.toHaveProperty("leader");
  });

  it("returns 400 for an invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/doesn't look like an email address/);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for a body that isn't JSON", async () => {
    const res = await POST(makeRequest("not json"));
    expect(res.status).toBe(400);
  });

  it("returns 403 when App Check fails", async () => {
    vi.mocked(verifyAppCheckToken).mockResolvedValueOnce(false);
    const res = await POST(makeRequest({ email: "walker@example.com" }));
    expect(res.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("quietly ignores bots that fill in the honeypot", async () => {
    const res = await POST(makeRequest({ email: "bot@example.com", website: "http://spam" }));
    expect(res.status).toBe(200);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 503 when Firestore is unavailable", async () => {
    vi.mocked(isFirestoreAvailable).mockReturnValueOnce(false);
    const res = await POST(makeRequest({ email: "walker@example.com" }));
    expect(res.status).toBe(503);
  });

  it("returns 500 when the write fails", async () => {
    mockCreate.mockRejectedValueOnce(new Error("boom"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});
    const res = await POST(makeRequest({ email: "walker@example.com" }));
    expect(res.status).toBe(500);
  });

  it("rate-limits after 5 sign-ups from one IP", async () => {
    const ip = nextIp();
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest({ email: `walker${i}@example.com` }, ip));
      expect(res.status).toBe(200);
    }
    const res = await POST(makeRequest({ email: "walker5@example.com" }, ip));
    expect(res.status).toBe(429);
  });
});

describe("launch site wording", () => {
  // Retired in the 19 Oct 2026 launch plan: they imply a gate that doesn't exist
  const BANNED = [
    "apply",
    "be first",
    "first access",
    "early access",
    "early look",
    "waitlist",
    "wait list",
    "one of 30",
    "exclusive",
    "vip",
    "unlock",
    "referral",
    "prize",
  ];
  const files = [
    "src/content/launch.ts",
    "src/components/launch/LaunchSite.tsx",
    "src/components/launch/LaunchSignup.tsx",
    "src/components/launch/StripMap.tsx",
    "src/components/launch/HeightProfile.tsx",
    "src/components/launch/BigMap.tsx",
    "src/components/launch/FoldMap.tsx",
    "src/components/launch/TapDemo.tsx",
    "src/app/(launch)/opengraph-image.tsx",
    "src/app/(launch)/page.tsx",
    "src/lib/validation/launchList.ts",
  ];

  for (const file of files) {
    it(`${file} uses none of the retired words`, () => {
      const text = readFileSync(join(process.cwd(), file), "utf8").toLowerCase();
      for (const word of BANNED) {
        expect(text, `"${word}" found in ${file}`).not.toMatch(
          new RegExp(`\\b${word.replace(/ /g, "\\s+")}\\b`)
        );
      }
    });
  }
});
