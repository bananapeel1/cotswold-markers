import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth, getDb, isFirestoreAvailable } from "./firebase";

const SESSION_COOKIE = "__session";

interface VerifiedSession {
  authenticated: true;
  uid: string;
  email?: string;
  name?: string;
}

async function verifySessionCookieValue(
  sessionCookie: string | undefined
): Promise<VerifiedSession | null> {
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

async function isAllowedAdmin(session: VerifiedSession): Promise<boolean> {
  if (!session.email) return false;
  if (!isFirestoreAvailable()) return false;

  try {
    const db = getDb();
    const adminDoc = await db
      .collection("allowedAdmins")
      .doc(session.email)
      .get();
    return adminDoc.exists;
  } catch {
    return false;
  }
}

/**
 * Verify that the request has a valid Firebase session cookie.
 * Returns session info or null if invalid/missing.
 */
export async function verifySession(
  request: NextRequest
): Promise<VerifiedSession | null> {
  return verifySessionCookieValue(request.cookies.get(SESSION_COOKIE)?.value);
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
  return (await isAllowedAdmin(session)) ? session : null;
}

/**
 * Same admin check for Server Components (layouts/pages), where there is no
 * NextRequest — reads the session cookie via next/headers instead.
 */
export async function verifyAdminFromCookies(): Promise<VerifiedSession | null> {
  const cookieStore = await cookies();
  const session = await verifySessionCookieValue(
    cookieStore.get(SESSION_COOKIE)?.value
  );
  if (!session) return null;
  return (await isAllowedAdmin(session)) ? session : null;
}
