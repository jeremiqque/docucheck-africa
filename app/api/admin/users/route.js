import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/admin/users - admin-only: provision a new user account.
export async function POST(request) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Server is not configured for user provisioning (missing SUPABASE_SERVICE_ROLE_KEY)." },
        { status: 500 }
      );
    }

    // ── Verify the caller is an admin ──
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", caller.user.id)
      .single();
    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // ── Validate input ──
    const body = await request.json();
    const { full_name, email, password, organisation, role } = body;
    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email and password are required" },
        { status: 400 }
      );
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // ── Create the user (already confirmed, so they can log in immediately) ──
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, organisation: organisation || null },
    });
    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    // ── Ensure the profile reflects the provided details + role ──
    const { error: profileErr } = await admin.from("profiles").upsert({
      id: created.user.id,
      full_name,
      organisation: organisation || null,
      role: role === "admin" ? "admin" : "user",
    });
    if (profileErr) {
      console.error("Profile upsert error:", profileErr.message);
    }

    return NextResponse.json({ success: true, user: created.user });
  } catch (error) {
    console.error("Admin create user error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
