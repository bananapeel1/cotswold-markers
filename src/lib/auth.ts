import { NextRequest } from "next/server";
import { getAdminAuth } from "./firebase";

const SESSION_COOKIE = "__session";

interface VerifiedSession {
  authenticated: true;
  uid: string;
  email?: string;
  name?: string;
}

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
