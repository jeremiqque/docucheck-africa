import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/members - list the members of the caller's workspace (owner only).
export async function GET(request) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ success: true, members: [] });

    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { data: caller } = await admin.auth.getUser(token);
    if (!caller?.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    // Caller must own a workspace.
    const { data: owned } = await admin
      .from("organisation_members")
      .select("organisation_id")
      .eq("user_id", caller.user.id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    if (!owned) return NextResponse.json({ success: true, members: [] });

    const orgId = owned.organisation_id;

    const { data: rows } = await admin
      .from("organisation_members")
      .select("user_id, role, created_at")
      .eq("organisation_id", orgId)
      .order("created_at", { ascending: true });

    const ids = (rows || []).map((r) => r.user_id);
    const profilesById = {};
    if (ids.length) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, full_name, organisation")
        .in("id", ids);
      (profs || []).forEach((p) => {
        profilesById[p.id] = p;
      });
    }

    const members = (rows || []).map((r) => ({
      user_id: r.user_id,
      role: r.role,
      full_name: profilesById[r.user_id]?.full_name || null,
      organisation: profilesById[r.user_id]?.organisation || null,
    }));

    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("List members error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
