import { NextRequest } from "next/server";
import { getAdminAuth } from "./firebase";

const SESSION_COOKIE = "__session";

export async function verifySession(
  request: NextRequest
): Promise<{ authenticated: boolean; email?: string }> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return { authenticated: false };

  try {
    const decoded = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true
    );
    return { authenticated: true, email: decoded.email };
  } catch {
    return { authenticated: false };
  }
}
