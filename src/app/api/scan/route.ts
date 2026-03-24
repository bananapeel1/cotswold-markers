import { NextRequest } from "next/server";

// In-memory scan store for MVP (resets on server restart)
const scans: Array<{
  markerId: string;
  timestamp: string;
  source: string;
  userAgent: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markerId, source = "direct" } = body;

    if (!markerId) {
      return Response.json({ error: "markerId required" }, { status: 400 });
    }

    scans.push({
      markerId,
      timestamp: new Date().toISOString(),
      source,
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return Response.json({ success: true, totalScans: scans.length });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  return Response.json({
    scans,
    total: scans.length,
  });
}
