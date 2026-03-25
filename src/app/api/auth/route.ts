import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "trailtap2026";
const COOKIE_NAME = "trailtap-admin";
const COOKIE_VALUE = "authenticated";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
  const { password } = body;

  if (password && password === ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
