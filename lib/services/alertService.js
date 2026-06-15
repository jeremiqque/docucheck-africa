import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Main alert function ────────────────────────────────────────
export async function sendComplianceAlert({
  recipientEmail,
  projectName,
  documentType,
  verdict,
  message,
  expiryDate,
  jurisdiction,
}) {
  try {
    console.log(`Sending ${verdict} alert to ${recipientEmail}...`);

    const subject = getSubject(verdict, documentType);
    const html = getEmailTemplate({
      projectName,
      documentType,
      verdict,
      message,
      expiryDate,
      jurisdiction,
    });

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: recipientEmail,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }

    console.log("Alert email sent successfully:", data.id);
    return { success: true, id: data.id };

  } catch (error) {
    console.error("Alert service error:", error.message);
    return { success: false, error: error.message };
  }
}

// ── Email subject line ─────────────────────────────────────────
function getSubject(verdict, documentType) {
  const doc = documentType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  if (verdict === "fail") {
    return `🔴 COMPLIANCE FAIL: ${doc} Rejected`;
  }
  if (verdict === "warning") {
    return `🟡 COMPLIANCE WARNING: ${doc} Needs Attention`;
  }
  return `🟢 COMPLIANCE PASS: ${doc} Verified`;
}

// ── Professional HTML email template ──────────────────────────
function getEmailTemplate({
  projectName,
  documentType,
  verdict,
  message,
  expiryDate,
  jurisdiction,
}) {
  const doc = documentType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const colors = {
    fail: { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", badge: "#DC2626" },
    warning: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", badge: "#D97706" },
    pass: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", badge: "#16A34A" },
  };

  const color = colors[verdict] || colors.pass;
  const label = verdict.toUpperCase();
  const jLabel = jurisdiction
    ? jurisdiction.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;
              border-radius:12px;overflow:hidden;
              box-shadow:0 4px 16px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#0F2545;padding:24px 28px;
                border-bottom:3px solid #E8A020;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="background:#E8A020;width:36px;height:36px;
                        border-radius:8px;display:inline-block;
                        text-align:center;line-height:36px;
                        font-weight:800;font-size:14px;color:#0F2545;">
              DC
            </div>
            <span style="color:#fff;font-size:18px;font-weight:700;
                         margin-left:10px;vertical-align:middle;">
              DocuCheck Africa
            </span>
          </td>
          <td align="right">
            <span style="color:rgba(255,255,255,0.5);font-size:11px;">
              AI Compliance Management
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Verdict Banner -->
    <div style="background:${color.badge};padding:16px 28px;">
      <span style="color:#fff;font-size:22px;font-weight:800;
                   letter-spacing:1px;">
        ${label}
      </span>
      <span style="color:rgba(255,255,255,0.8);font-size:13px;
                   margin-left:12px;">
        Compliance Verification Result
      </span>
    </div>

    <!-- Content -->
    <div style="padding:28px;">
      <p style="color:#4A5568;font-size:14px;margin:0 0 20px;">
        A compliance check has been completed for the following document.
        Please review the result and take any required action.
      </p>

      <!-- Details Table -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border-collapse:collapse;margin-bottom:20px;">
        <tr style="background:#F0F4FA;">
          <td style="padding:11px 14px;font-weight:700;color:#0F2545;
                     font-size:13px;width:35%;border-bottom:1px solid #DDE3F0;">
            Project
          </td>
          <td style="padding:11px 14px;color:#2D3748;font-size:13px;
                     border-bottom:1px solid #DDE3F0;">
            ${projectName}
          </td>
        </tr>
        <tr>
          <td style="padding:11px 14px;font-weight:700;color:#0F2545;
                     font-size:13px;border-bottom:1px solid #DDE3F0;">
            Document Type
          </td>
          <td style="padding:11px 14px;color:#2D3748;font-size:13px;
                     border-bottom:1px solid #DDE3F0;">
            ${doc}
          </td>
        </tr>
        ${jurisdiction ? `
        <tr style="background:#F0F4FA;">
          <td style="padding:11px 14px;font-weight:700;color:#0F2545;
                     font-size:13px;border-bottom:1px solid #DDE3F0;">
            Jurisdiction
          </td>
          <td style="padding:11px 14px;color:#2D3748;font-size:13px;
                     border-bottom:1px solid #DDE3F0;">
            ${jLabel}
          </td>
        </tr>
        ` : ""}
        <tr ${jurisdiction ? "" : 'style="background:#F0F4FA;"'}>
          <td style="padding:11px 14px;font-weight:700;color:#0F2545;
                     font-size:13px;border-bottom:1px solid #DDE3F0;">
            Verdict
          </td>
          <td style="padding:11px 14px;font-weight:700;
                     color:${color.badge};font-size:13px;
                     border-bottom:1px solid #DDE3F0;">
            ${label}
          </td>
        </tr>
        ${expiryDate ? `
        <tr style="background:#F0F4FA;">
          <td style="padding:11px 14px;font-weight:700;color:#0F2545;
                     font-size:13px;">
            Expiry Date
          </td>
          <td style="padding:11px 14px;color:#2D3748;font-size:13px;">
            ${expiryDate}
          </td>
        </tr>
        ` : ""}
      </table>

      <!-- Message Box -->
      <div style="background:${color.bg};border:1px solid ${color.border};
                  border-left:4px solid ${color.badge};
                  border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;color:${color.text};font-size:13px;
                  line-height:1.6;">
          ${message}
        </p>
      </div>

      <!-- CTA -->
      <p style="color:#718096;font-size:12px;margin:0;">
        Log in to DocuCheck Africa to view the full compliance report,
        review extracted fields, and take the required action.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F0F4FA;padding:16px 28px;
                border-top:1px solid #DDE3F0;">
      <p style="color:#9CA3AF;font-size:11px;margin:0;text-align:center;">
        This is an automated message from DocuCheck Africa,
        AI-Assisted Compliance Management for the African Built Environment.
        Do not reply to this email.
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

// ── Expiry alert helper ────────────────────────────────────────
export async function sendExpiryAlert({
  recipientEmail,
  projectName,
  documentType,
  expiryDate,
  daysLeft,
}) {
  const urgency = daysLeft <= 30 ? "urgent" : "upcoming";
  const message = daysLeft <= 30
    ? `This document expires in ${daysLeft} days. Immediate renewal is required to avoid a compliance failure that will block your project.`
    : `This document expires in ${daysLeft} days. Please arrange renewal soon to maintain compliance status.`;

  return sendComplianceAlert({
    recipientEmail,
    projectName,
    documentType,
    verdict: "warning",
    message,
    expiryDate,
  });
}