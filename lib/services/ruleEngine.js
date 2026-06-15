import requirementsMatrix from "@/data/requirementsMatrix.json";

// ── Main compliance check function ────────────────────────────
export function checkCompliance(fields, jurisdiction, phase) {
  console.log(`Running compliance checks for ${jurisdiction}...`);

  const results = [];
  let verdict = "pass";

  // ── Check 1: Expiry date validation ───────────────────────
  if (fields.expiry_date) {
    const expiryDate = new Date(fields.expiry_date);
    const today = new Date();
    const daysLeft = Math.floor(
      (expiryDate - today) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
      results.push({
        check: "expiry_date",
        status: "fail",
        message: `Document expired ${Math.abs(daysLeft)} days ago, must be renewed immediately`,
      });
      verdict = "fail";
    } else if (daysLeft <= 30) {
      results.push({
        check: "expiry_date",
        status: "warning",
        message: `Document expires in ${daysLeft} days, urgent renewal required`,
      });
      if (verdict === "pass") verdict = "warning";
    } else if (daysLeft <= 90) {
      results.push({
        check: "expiry_date",
        status: "warning",
        message: `Document expires in ${daysLeft} days, renewal recommended`,
      });
      if (verdict === "pass") verdict = "warning";
    } else {
      results.push({
        check: "expiry_date",
        status: "pass",
        message: `Document valid, ${daysLeft} days remaining`,
      });
    }
  } else {
    results.push({
      check: "expiry_date",
      status: "warning",
      message: "Expiry date not found. Please verify document validity manually",
    });
    if (verdict === "pass") verdict = "warning";
  }

  // ── Check 2: Mandatory field presence ─────────────────────
  const mandatoryFields = [
    { key: "issue_date", label: "Issue date" },
    { key: "issuing_authority", label: "Issuing authority" },
    { key: "holder_name", label: "Certificate holder name" },
  ];

  let allFieldsPresent = true;

  mandatoryFields.forEach(({ key, label }) => {
    if (!fields[key]) {
      results.push({
        check: "field_presence",
        status: "fail",
        message: `Missing required field: ${label} not found in document`,
      });
      verdict = "fail";
      allFieldsPresent = false;
    }
  });

  if (allFieldsPresent) {
    results.push({
      check: "field_presence",
      status: "pass",
      message: "All mandatory fields present and extracted",
    });
  }

  // ── Check 3: Issuing authority verification ────────────────
  const docType = fields.document_type;
  const jurisdictionData = requirementsMatrix[jurisdiction];

  if (jurisdictionData && docType && fields.issuing_authority) {
    const allDocs = [
      ...(jurisdictionData.pre_construction || []),
      ...(jurisdictionData.post_construction || []),
    ];

    const docRequirement = allDocs.find(
      (req) => req.document_type === docType
    );

    if (docRequirement) {
      const authorityMatch = docRequirement.issuing_authorities.some(
        (auth) =>
          fields.issuing_authority
            .toLowerCase()
            .includes(auth.toLowerCase()) ||
          auth.toLowerCase().includes(
            fields.issuing_authority.toLowerCase()
          )
      );

      if (!authorityMatch) {
        results.push({
          check: "issuing_authority",
          status: "warning",
          message: `Issuing authority "${fields.issuing_authority}" could not be verified against approved authorities for ${docType} in ${jurisdiction}`,
        });
        if (verdict === "pass") verdict = "warning";
      } else {
        results.push({
          check: "issuing_authority",
          status: "pass",
          message: `Issuing authority verified: ${fields.issuing_authority}`,
        });
      }
    }
  }

  // ── Check 4: Jurisdiction alignment ───────────────────────
  if (fields.jurisdiction) {
    if (fields.jurisdiction !== jurisdiction) {
      results.push({
        check: "jurisdiction",
        status: "fail",
        message: `Document jurisdiction (${fields.jurisdiction}) does not match project jurisdiction (${jurisdiction})`,
      });
      verdict = "fail";
    } else {
      results.push({
        check: "jurisdiction",
        status: "pass",
        message: `Jurisdiction verified: ${jurisdiction}`,
      });
    }
  }

  // ── Check 5: Issue date not in future ─────────────────────
  if (fields.issue_date) {
    const issueDate = new Date(fields.issue_date);
    const today = new Date();

    if (issueDate > today) {
      results.push({
        check: "issue_date",
        status: "fail",
        message: "Issue date is in the future. The document may be fraudulent or incorrectly dated",
      });
      verdict = "fail";
    } else {
      results.push({
        check: "issue_date",
        status: "pass",
        message: "Issue date is valid",
      });
    }
  }

  // ── Check 6: Date sequence validation ─────────────────────
  if (fields.issue_date && fields.expiry_date) {
    const issueDate = new Date(fields.issue_date);
    const expiryDate = new Date(fields.expiry_date);

    if (expiryDate <= issueDate) {
      results.push({
        check: "date_sequence",
        status: "fail",
        message: "Expiry date is before or the same as the issue date. The document is invalid",
      });
      verdict = "fail";
    } else {
      results.push({
        check: "date_sequence",
        status: "pass",
        message: "Date sequence is valid: issue date is before expiry date",
      });
    }
  }

  console.log(`Compliance check complete - verdict: ${verdict.toUpperCase()}`);

  return {
    verdict,
    checks: results,
    summary: getSummary(verdict, results),
  };
}

// ── Helper: Generate plain English summary ────────────────────
function getSummary(verdict, checks) {
  const failed = checks.filter((c) => c.status === "fail");
  const warnings = checks.filter((c) => c.status === "warning");

  if (verdict === "fail") {
    return `Document failed compliance verification. ${failed.length} critical issue${failed.length > 1 ? "s" : ""} found: ${failed.map((f) => f.message).join("; ")}`;
  }

  if (verdict === "warning") {
    return `Document passed with ${warnings.length} warning${warnings.length > 1 ? "s" : ""}. ${warnings.map((w) => w.message).join("; ")}`;
  }

  return "Document passed all compliance checks successfully.";
}

// ── Helper: Get required documents for a project ──────────────
export function getRequiredDocuments(jurisdiction, phase) {
  const jurisdictionData = requirementsMatrix[jurisdiction];
  if (!jurisdictionData) return [];
  return jurisdictionData[phase] || [];
}

// ── Helper: Check if all mandatory docs are verified ──────────
export function isProjectCleared(checklist) {
  const mandatory = checklist.filter((item) => item.mandatory !== false);
  return mandatory.every((item) => item.status === "verified");
}