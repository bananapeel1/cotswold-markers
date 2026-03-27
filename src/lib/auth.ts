import { NextRequest } from "next/server";
import { getAdminAuth, getDb, isFirestoreAvailable } from "./firebase";

const SESSION_COOKIE = "__session";

interface VerifiedSession {
  authenticated: true;
  uid: string;
  email?: string;
  name?: string;
}

/**
 * Verify that the request has a valid Firebase session cookie.
 * Returns session info or null if invalid/missing.
 */
export async function verifySession(
  request: NextRequest
): Promise<VerifiedSession | null> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true
    );
    return {
      authenticated: true,
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}

/**
 * Verify that the request has a valid session AND the user is an admin.
 * Checks the allowedAdmins Firestore collection.
 */
export async function verifyAdmin(
  request: NextRequest
): Promise<VerifiedSession | null> {
  const session = await verifySession(request);
  if (!session) return null;

  if (!session.email) return null;

  if (!isFirestoreAvailable()) return null;

  try {
    const db = getDb();
    const adminDoc = await db
      .collection("allowedAdmins")
      .doc(session.email)
      .get();
    if (!adminDoc.exists) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Verify session cookie value directly (for use in middleware).
 * Returns decoded token or null.
 */
export async function verifySessionCookie(
  cookieValue: string
): Promise<{ uid: string; email?: string } | null> {
  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookieValue, true);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
