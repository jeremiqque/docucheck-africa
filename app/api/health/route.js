import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Lightweight warm-up endpoint: pings Supabase with a trivial query so the
// database (and this serverless function) stay warm. Point a free uptime
// monitor at /api/health every ~5 minutes to avoid cold-start lag.
export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("organisations").select("id", { head: true, count: "exact" }).limit(1);
    }
    return NextResponse.json({ ok: true, ms: Date.now() - start });
  } catch {
    // Still 200 so the monitor reads "up"; the query attempt is what warms the DB.
    return NextResponse.json({ ok: false, ms: Date.now() - start });
  }
}
