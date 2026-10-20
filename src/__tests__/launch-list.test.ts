import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";

const mockCreate = vi.fn(async (_data: Record<string, unknown>) => {});
const mockDocFn = vi.fn((_id: string) => ({ create: mockCreate }));
const mockCollectionFn = vi.fn((_name: string) => ({ doc: mockDocFn }));

vi.mock("@/lib/firebase", () => ({
  getDb: () => ({ collection: mockCollectionFn }),
  isFirestoreAvailable: vi.fn(() => true),
  verifyAppCheckToken: vi.fn(async () => true),
}));

import { isFirestoreAvailable, verifyAppCheckToken } from "@/lib/firebase";
import { POST } from "@/app/api/launch-list/route";
import { launchListDocId } from "@/lib/launchList";
import {
  launchListSignupSchema,
  LAUNCH_LIST_CONSENT_TEXT,
  LAUNCH_LIST_CONSENT_VERSION,
} from "@/lib/validation/launchList";

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
    const parsed = launchListSignupSchema.parse({ email: "  Walker@Example.COM ", consent: true });
    expect(parsed.email).toBe("walker@example.com");
  });

  it("asks for an email when it is empty", () => {
    const result = launchListSignupSchema.safeParse({ email: "  ", consent: true });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Please enter your email address");
  });

  it("rejects an unticked consent box", () => {
    const result = launchListSignupSchema.safeParse({ email: "a@b.co", consent: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["consent"]);
  });

  it("drops a malformed source instead of failing", () => {
    const parsed = launchListSignupSchema.parse({
      email: "a@b.co",
      consent: true,
      source: "<script>",
    });
    expect(parsed.source).toBeUndefined();
  });
});

describe("POST /api/launch-list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockImplementation(async () => {});
  });

  it("stores the sign-up with its consent record", async () => {
    const res = await POST(
      makeRequest({ email: " Walker@Example.com", consent: true, source: "Instagram" })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });

    expect(mockCollectionFn).toHaveBeenCalledWith("launchList");
    expect(mockDocFn).toHaveBeenCalledWith(launchListDocId("walker@example.com"));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "walker@example.com",
        consentText: LAUNCH_LIST_CONSENT_TEXT,
        consentVersion: LAUNCH_LIST_CONSENT_VERSION,
        source: "instagram",
        status: "subscribed",
      })
    );
    // Data minimisation: no IP or other request data in the stored record
    const stored = mockCreate.mock.calls[0][0];
    expect(Object.keys(stored).sort()).toEqual(
      ["consentText", "consentVersion", "createdAt", "email", "source", "status"].sort()
    );
  });

  it("gives the same answer when the email is already on the list", async () => {
    mockCreate.mockRejectedValueOnce(Object.assign(new Error("exists"), { code: 6 }));
    const res = await POST(makeRequest({ email: "walker@example.com", consent: true }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("returns 400 for an invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", consent: true }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Please enter a valid email address");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 without consent", async () => {
    const res = await POST(makeRequest({ email: "walker@example.com" }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for a body that isn't JSON", async () => {
    const res = await POST(makeRequest("not json"));
    expect(res.status).toBe(400);
  });

  it("returns 403 when App Check fails", async () => {
    vi.mocked(verifyAppCheckToken).mockResolvedValueOnce(false);
    const res = await POST(makeRequest({ email: "walker@example.com", consent: true }));
    expect(res.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("quietly ignores bots that fill in the honeypot", async () => {
    const res = await POST(
      makeRequest({ email: "bot@example.com", consent: true, website: "http://spam" })
    );
    expect(res.status).toBe(200);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 503 when Firestore is unavailable", async () => {
    vi.mocked(isFirestoreAvailable).mockReturnValueOnce(false);
    const res = await POST(makeRequest({ email: "walker@example.com", consent: true }));
    expect(res.status).toBe(503);
  });

  it("returns 500 when the write fails", async () => {
    mockCreate.mockRejectedValueOnce(new Error("boom"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});
    const res = await POST(makeRequest({ email: "walker@example.com", consent: true }));
    expect(res.status).toBe(500);
  });

  it("rate-limits after 5 sign-ups from one IP", async () => {
    const ip = nextIp();
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest({ email: `walker${i}@example.com`, consent: true }, ip));
      expect(res.status).toBe(200);
    }
    const res = await POST(makeRequest({ email: "walker5@example.com", consent: true }, ip));
    expect(res.status).toBe(429);
  });
});

describe("launch page wording", () => {
  // Retired in the 19 Oct 2026 launch plan: they imply a gate that doesn't exist
  const BANNED = [
    "apply",
    "be first",
    "first access",
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
    "src/app/launch/page.tsx",
    "src/app/launch/opengraph-image.tsx",
    "src/components/LaunchListForm.tsx",
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
