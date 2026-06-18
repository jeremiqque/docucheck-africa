import { NextResponse } from "next/server";
import { getSupabaseForToken, getBearerToken } from "@/lib/supabaseServer";
import { generateNarrative } from "@/lib/services/gptService";

// GET /api/reports?projectId=xxx
// Returns all documents and compliance results for a project
export async function GET(request) {
  try {
    const __token = getBearerToken(request);
    if (!__token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const supabase = getSupabaseForToken(__token);
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) {
      return NextResponse.json(
        { error: projectError.message },
        { status: 500 }
      );
    }

    // Get all documents for project
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false });

    if (docsError) {
      return NextResponse.json(
        { error: docsError.message },
        { status: 500 }
      );
    }

    // Get compliance checklist
    const { data: checklist, error: checklistError } = await supabase
      .from("compliance_checklist")
      .select("*")
      .eq("project_id", projectId);

    if (checklistError) {
      return NextResponse.json(
        { error: checklistError.message },
        { status: 500 }
      );
    }

    // Build report summary
    const report = {
      project,
      documents,
      checklist,
      generated_at: new Date().toISOString(),
      summary: {
        total_documents: documents.length,
        passed: documents.filter((d) => d.verdict === "pass").length,
        warnings: documents.filter((d) => d.verdict === "warning").length,
        failed: documents.filter((d) => d.verdict === "fail").length,
        pending: checklist.filter((c) => c.status === "pending").length,
        verified: checklist.filter((c) => c.status === "verified").length,
      },
    };

    return NextResponse.json({
      success: true,
      report,
    });

  } catch (error) {
    console.error("GET reports error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/reports
// Generates AI narrative for compliance report
export async function POST(request) {
  try {
    const __token = getBearerToken(request);
    if (!__token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const supabase = getSupabaseForToken(__token);
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) {
      return NextResponse.json(
        { error: projectError.message },
        { status: 500 }
      );
    }

    // Get documents
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId);

    if (docsError) {
      return NextResponse.json(
        { error: docsError.message },
        { status: 500 }
      );
    }

    // Generate AI narrative
    const narrative = await generateNarrative(project, documents);

    return NextResponse.json({
      success: true,
      narrative,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error("POST reports error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}