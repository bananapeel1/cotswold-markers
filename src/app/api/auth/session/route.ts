import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase";
import { getDb, isFirestoreAvailable } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "__session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const MAX_AGE_MS = MAX_AGE * 1000;

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  const { idToken } = body;
  if (!idToken) {
    return NextResponse.json(
      { success: false, error: "Missing idToken" },
      { status: 400 }
    );
  }

  try {
    // Verify the ID token
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const email = decoded.email;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "No email associated with account" },
        { status: 401 }
      );
    }

    // Check if email is in allowedAdmins
    if (isFirestoreAvailable()) {
      const db = getDb();
      const doc = await db.collection("allowedAdmins").doc(email).get();
      if (!doc.exists) {
        return NextResponse.json(
          { success: false, error: "You are not authorized as an admin" },
          { status: 403 }
        );
      }
    }

    // Create session cookie
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: MAX_AGE_MS,
    });

    const response = NextResponse.json({ success: true, email });
    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Session creation failed:", err);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
