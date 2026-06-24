import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function bearer(request) {
  return (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
}

// Owner's workspace, or null.
async function ownerOrg(admin, userId) {
  const { data } = await admin
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", userId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  return data?.organisation_id || null;
}

// POST /api/invites - owner invites someone to their workspace by email.
export async function POST(request) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Server is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." },
        { status: 500 }
      );
    }

    const token = bearer(request);
    if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const role = "member"; // invitees are always members; owners cannot be invited
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const orgId = await ownerOrg(admin, caller.user.id);
    if (!orgId) {
      return NextResponse.json(
        { error: "Only a workspace owner can invite members" },
        { status: 403 }
      );
    }

    // Record the invite first so the signup trigger can honour it.
    const { data: invite, error: invErr } = await admin
      .from("invites")
      .insert({ organisation_id: orgId, email, role, invited_by: caller.user.id })
      .select()
      .single();
    if (invErr) {
      return NextResponse.json({ error: invErr.message }, { status: 500 });
    }

    // Send the branded invite email + create the invited user.
    const origin = new URL(request.url).origin;
    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });
    if (inviteErr) {
      // Roll back the invite row so it does not linger as pending.
      await admin.from("invites").delete().eq("id", invite.id);
      const msg = /already.*registered|exists/i.test(inviteErr.message)
        ? "That email already has an account. Direct-add for existing users is coming soon."
        : inviteErr.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Invitation sent" });
  } catch (error) {
    console.error("Invite error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/invites - list invites for the caller's workspace (owner only).
export async function GET(request) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ success: true, invites: [] });

    const token = bearer(request);
    if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { data: caller } = await admin.auth.getUser(token);
    if (!caller?.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const orgId = await ownerOrg(admin, caller.user.id);
    if (!orgId) return NextResponse.json({ success: true, invites: [] });

    const { data: invites } = await admin
      .from("invites")
      .select("id, email, role, status, created_at")
      .eq("organisation_id", orgId)
      .order("created_at", { ascending: false });

    return NextResponse.json({ success: true, invites: invites || [] });
  } catch (error) {
    console.error("List invites error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
