import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSupabaseForToken, getBearerToken } from "@/lib/supabaseServer";
import { extractText } from "@/lib/services/ocrService";
import { classifyDocument, extractFields, detectAnomalies } from "@/lib/services/gptService";
import { checkCompliance } from "@/lib/services/ruleEngine";
import { sendComplianceAlert } from "@/lib/services/alertService";

// The AI pipeline (vision OCR + 3 GPT calls) can exceed Vercel's default
// function timeout. Use the Node runtime and allow up to 60 seconds.
export const runtime = "nodejs";
export const maxDuration = 60;

// Cloudflare R2 (S3-compatible) storage client
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// POST /api/documents
// Runs the complete 9-step AI compliance pipeline
export async function POST(request) {
  try {
    const __token = getBearerToken(request);
    if (!__token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const supabase = getSupabaseForToken(__token);
    const formData = await request.formData();
    const file = formData.get("file");
    const projectId = formData.get("project_id");
    const jurisdiction = formData.get("jurisdiction");
    const phase = formData.get("phase") || "pre_construction";
    const userEmail = formData.get("user_email");

    // Validate inputs
    if (!file || !projectId || !jurisdiction) {
      return NextResponse.json(
        { error: "File, project ID and jurisdiction are required" },
        { status: 400 }
      );
    }

    console.log(`Processing: ${file.name}`);

    // ── Step 1: Convert file to buffer ─────────────────────
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${projectId}/${Date.now()}_${file.name}`;

    // ── Step 2: Validate file ──────────────────────────────
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF, JPEG or PNG" },
        { status: 400 }
      );
    }

    if (fileBuffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // ── Step 3: Store in Cloudflare R2 ────────────────────────────
    console.log("Uploading to Cloudflare R2...");
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: fileName,
        Body: fileBuffer,
        ContentType: file.type,
      })
    );

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    // ── Step 4: OCR extraction ─────────────────────────────
    const ocrResult = await extractText(fileBuffer, file.type);

    if (!ocrResult.text || ocrResult.text.trim().length < 10) {
      return NextResponse.json(
        { error: "Could not extract text from document. Please upload a clearer image." },
        { status: 400 }
      );
    }

    // ── Step 5: Classify document ──────────────────────────
    const classification = await classifyDocument(ocrResult.text);

    // ── Step 6: Extract data fields ────────────────────────
    const fields = await extractFields(
      ocrResult.text,
      classification.document_type
    );

    // ── Step 7: Run compliance rule engine ─────────────────
    const complianceResult = checkCompliance(fields, jurisdiction, phase);

    // ── Step 8: Detect anomalies ───────────────────────────
    const anomalyResult = await detectAnomalies(fields);

    // ── Step 9: Save to Supabase ───────────────────────────
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_url: fileUrl,
        document_type: classification.document_type,
        status: "verified",
        extracted_fields: fields,
        verdict: complianceResult.verdict,
        explanation: complianceResult.summary,
        anomalies: anomalyResult,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError.message);
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    // Update compliance checklist
    await supabase
      .from("compliance_checklist")
      .update({
        status: complianceResult.verdict === "pass" ? "verified" : "failed",
        document_id: document.id,
      })
      .eq("project_id", projectId)
      .eq("document_type", classification.document_type);

    // Write to audit log
    await supabase.from("audit_logs").insert({
      project_id: projectId,
      document_id: document.id,
      action: `Document processed: ${classification.document_type} (${complianceResult.verdict.toUpperCase()})`,
      details: {
        verdict: complianceResult.verdict,
        checks: complianceResult.checks,
        ocr_confidence: ocrResult.confidence,
      },
    });

    // Save alert to database
    if (complianceResult.verdict !== "pass") {
      await supabase.from("alerts").insert({
        project_id: projectId,
        document_id: document.id,
        type: complianceResult.verdict,
        message: complianceResult.summary,
        is_read: false,
      });
    }

    // Send email alert if needed
    if (complianceResult.verdict !== "pass" && userEmail) {
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();

      await sendComplianceAlert({
        recipientEmail: userEmail,
        projectName: project?.name || "Your Project",
        documentType: classification.document_type,
        verdict: complianceResult.verdict,
        message: complianceResult.summary,
        expiryDate: fields.expiry_date,
        jurisdiction,
      });
    }

    // Return complete result
    return NextResponse.json({
      success: true,
      document,
      classification,
      fields,
      compliance: complianceResult,
      anomalies: anomalyResult,
      ocr: {
        confidence: ocrResult.confidence,
        lineCount: ocrResult.lineCount,
        isLowQuality: ocrResult.isLowQuality,
      },
    });

  } catch (error) {
    console.error("Document processing error:", error.message);
    return NextResponse.json(
      { error: error.message || "Document processing failed" },
      { status: 500 }
    );
  }
}

// GET /api/documents?projectId=xxx
// Returns all documents for a project
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

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: data,
    });

  } catch (error) {
    console.error("GET documents error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}