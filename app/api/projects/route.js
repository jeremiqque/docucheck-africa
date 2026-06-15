import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import requirementsMatrix from "@/data/requirementsMatrix.json";

// GET /api/projects
// Returns all projects for the current user
export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: data,
    });

  } catch (error) {
    console.error("GET projects error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects
// Creates a new project and generates compliance checklists
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, jurisdiction, project_type } = body;

    // Validate required fields
    if (!name || !jurisdiction || !project_type) {
      return NextResponse.json(
        { error: "Name, jurisdiction and project type are required" },
        { status: 400 }
      );
    }

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name,
        description,
        jurisdiction,
        project_type,
        status: "pre_compliance",
      })
      .select()
      .single();

    if (projectError) {
      return NextResponse.json(
        { error: projectError.message },
        { status: 500 }
      );
    }

    // Generate pre and post compliance checklists
    const jurisdictionData = requirementsMatrix[jurisdiction];

    if (jurisdictionData) {
      const checklistItems = [];

      // Add pre-construction items
      const preDocs = jurisdictionData.pre_construction || [];
      preDocs.forEach((doc) => {
        checklistItems.push({
          project_id: project.id,
          document_type: doc.document_type,
          phase: "pre_construction",
          status: "pending",
        });
      });

      // Add post-construction items
      const postDocs = jurisdictionData.post_construction || [];
      postDocs.forEach((doc) => {
        checklistItems.push({
          project_id: project.id,
          document_type: doc.document_type,
          phase: "post_construction",
          status: "pending",
        });
      });

      // Insert all checklist items
      const { error: checklistError } = await supabase
        .from("compliance_checklist")
        .insert(checklistItems);

      if (checklistError) {
        console.error("Checklist creation error:", checklistError.message);
      }
    }

    // Write to audit log
    await supabase.from("audit_logs").insert({
      project_id: project.id,
      action: `Project created: ${name} (${jurisdiction})`,
      details: { jurisdiction, project_type },
    });

    return NextResponse.json({
      success: true,
      project,
      message: "Project created successfully with compliance checklists",
    });

  } catch (error) {
    console.error("POST projects error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}