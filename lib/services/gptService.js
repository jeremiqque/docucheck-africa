import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CATEGORIES = [
  "building_permit",
  "safety_certificate",
  "eia_approval",
  "contractor_licence",
  "coren_certificate",
  "nhbrc_enrolment",
  "nhbrc_completion_certificate",
  "insurance_certificate",
  "inspection_report",
  "final_inspection_report",
  "structural_completion_certificate",
  "completion_certificate",
  "occupancy_approval",
  "fire_safety_certificate",
];

// ── Step 1: Classify document type ────────────────────────────
export async function classifyDocument(text) {
  console.log("Classifying document with GPT...");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a construction compliance expert specialising 
          in African building regulations for Nigeria, Ghana, and South Africa. 
          You classify compliance documents accurately.`,
        },
        {
          role: "user",
          content: `Classify this construction compliance document into 
exactly one of these categories:
${CATEGORIES.join(", ")}

Document text:
${text.slice(0, 3000)}

Rules:
- Return ONLY valid JSON
- Choose the single best matching category
- If unsure choose the closest match

Return JSON only:
{"document_type": "category_name", "confidence": 0.95}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`Document classified as: ${result.document_type}`);
    return result;

  } catch (error) {
    console.error("Classification error:", error.message);
    throw new Error(`Classification failed: ${error.message}`);
  }
}

// ── Step 2: Extract 8 data fields ─────────────────────────────
export async function extractFields(text, documentType) {
  console.log(`Extracting fields from ${documentType}...`);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a data extraction expert for African 
          construction compliance documents. You extract structured 
          data accurately from document text.`,
        },
        {
          role: "user",
          content: `Extract these 8 fields from this ${documentType} document.
Use null for any field you cannot find.

Document text:
${text.slice(0, 3000)}

Fields to extract:
1. document_type — the type of compliance document
2. issue_date — when the document was issued (YYYY-MM-DD format)
3. expiry_date — when the document expires (YYYY-MM-DD format)
4. issuing_authority — the organisation that issued the document
5. holder_name — the person or company the document belongs to
6. project_reference — any project or certificate reference number
7. jurisdiction — nigeria, ghana, or south_africa
8. document_id — the unique certificate or document number

Return JSON only — no explanation:
{
  "document_type": "${documentType}",
  "issue_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",
  "issuing_authority": "name or null",
  "holder_name": "name or null",
  "project_reference": "reference or null",
  "jurisdiction": "nigeria or ghana or south_africa or null",
  "document_id": "id or null"
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log("Fields extracted successfully");
    return result;

  } catch (error) {
    console.error("Extraction error:", error.message);
    throw new Error(`Field extraction failed: ${error.message}`);
  }
}

// ── Step 3: Detect anomalies ───────────────────────────────────
export async function detectAnomalies(fields) {
  console.log("Running anomaly detection...");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a compliance verification expert for 
          African construction projects. You detect logical 
          inconsistencies and anomalies in document data.`,
        },
        {
          role: "user",
          content: `Review these extracted compliance document fields 
for anomalies and logical inconsistencies.

Fields:
${JSON.stringify(fields, null, 2)}

Check for these issues:
1. Issue date is after expiry date
2. Document is already expired
3. Issue date is in the future
4. Jurisdiction does not match the issuing authority country
5. Certificate number format looks invalid or suspicious
6. Issuing authority name looks incorrect for the document type
7. Holder name is missing or looks incomplete

Return JSON only:
{
  "anomalies_found": true or false,
  "anomalies": ["clear description of each anomaly found"],
  "severity": "low or medium or high"
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`Anomaly detection complete — found: ${result.anomalies_found}`);
    return result;

  } catch (error) {
    console.error("Anomaly detection error:", error.message);
    return {
      anomalies_found: false,
      anomalies: [],
      severity: "low",
    };
  }
}

// ── Step 4: Generate report narrative ─────────────────────────
export async function generateNarrative(project, documents) {
  console.log("Generating compliance report narrative...");

  try {
    const passed = documents.filter((d) => d.verdict === "pass").length;
    const warnings = documents.filter((d) => d.verdict === "warning").length;
    const failed = documents.filter((d) => d.verdict === "fail").length;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional compliance report writer 
          for African construction projects. You write clear, 
          formal compliance summaries suitable for regulatory submission.`,
        },
        {
          role: "user",
          content: `Write a professional compliance summary report 
for this construction project.

Project Details:
- Name: ${project.name}
- Jurisdiction: ${project.jurisdiction}
- Type: ${project.project_type}
- Status: ${project.status}

Document Summary:
- Total documents: ${documents.length}
- Passed: ${passed}
- Warnings: ${warnings}
- Failed: ${failed}

Write exactly 3 paragraphs:
1. Project overview and compliance status
2. Summary of document verification results
3. Recommendations and next steps

Keep it formal, factual, and suitable for submission 
to a regulatory authority in Africa.`,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("Narrative generation error:", error.message);
    return "Compliance report narrative could not be generated.";
  }
}