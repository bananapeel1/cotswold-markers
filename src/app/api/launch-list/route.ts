import { NextRequest } from "next/server";
import { isFirestoreAvailable, verifyAppCheckToken } from "@/lib/firebase";
import { getLaunchListStore } from "@/lib/launchList";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";
import { formatIssues } from "@/lib/validation/schemas";
import { launchListSignupSchema } from "@/lib/validation/launchList";
import { momentOn, signupWordsFor, SIGNUP_CONSENT_VERSION, ukDate } from "@/content/launch";

export const dynamic = "force-dynamic";

// Per IP: 5 sign-ups per 10 minutes (a household or café can share an IP)
const limiter = createRateLimiter({ windowMs: 10 * 60_000, max: 5 });

export async function POST(request: NextRequest) {
  if (limiter.isLimited(clientIp(request))) {
    return Response.json(
      { error: "Too many sign-ups from here. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  const appCheckToken = request.headers.get("X-Firebase-AppCheck");
  if (!(await verifyAppCheckToken(appCheckToken))) {
    return Response.json(
      { error: "We couldn't check this came from our page. Please reload it and try again." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = launchListSignupSchema.safeParse(body);
  if (!parsed.success) {
    const issues = formatIssues(parsed.error);
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request", issues },
      { status: 400 }
    );
  }

  // Honeypot filled in: answer as if it worked so bots learn nothing
  if (parsed.data.website) {
    return Response.json({ success: true });
  }

  if (!isFirestoreAvailable()) {
    return Response.json(
      { error: "Sign-ups aren't working right now. Please try again later." },
      { status: 503 }
    );
  }

  // The words on the page the person saw today, stored as the consent record
  const moment = momentOn(ukDate());
  const words = signupWordsFor(moment);
  const { email, notes, leader } = parsed.data;

  try {
    await getLaunchListStore().add({
      email,
      notes,
      leader,
      consentText: {
        button: words.button,
        ...(notes ? { notes: `${words.notesLabel}. ${words.notesHint}` } : {}),
        ...(leader ? { leader: `${words.leaderLabel}. ${words.leaderHint}` } : {}),
      },
      consentVersion: SIGNUP_CONSENT_VERSION,
      moment,
      source: parsed.data.source ?? null,
      status: "subscribed",
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Launch list sign-up failed:", e);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  // Same answer for new and existing emails, so the form can't reveal who is on the list
  return Response.json({ success: true });
}
