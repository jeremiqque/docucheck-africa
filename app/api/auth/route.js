import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

// POST /api/auth
// Handles both register and login based on action field
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, email, password, full_name, organisation } = body;

    // ── Register ─────────────────────────────────────────────
    if (action === "register") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name, organisation },
        },
      });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Registration successful — please check your email to verify your account",
        user: data.user,
      });
    }

    // ── Login ─────────────────────────────────────────────────
    if (action === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: data.user,
        session: data.session,
      });
    }

    // ── Logout ────────────────────────────────────────────────
    if (action === "logout") {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Logged out successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Auth route error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}