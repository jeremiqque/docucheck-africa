# DocuCheck Africa — Software Requirements Document

> **For:** Coding agent / developer onboarding
> **Project:** AI-Assisted Pre and Post Compliance Management System for Construction Project Documentation in the African Built Environment
> **Status:** Backend complete and tested. Frontend pending.

---

## 1. Project Summary

DocuCheck Africa (DCA) is an AI-powered web application that automates verification of construction compliance documents for **Nigeria, Ghana, and South Africa**. A user uploads a compliance document (PDF, JPEG, PNG, DOCX); the system runs it through a nine-step AI pipeline (OCR → classification → field extraction → rule checking → anomaly detection) and returns a **Pass / Warning / Fail** verdict, stores the result, updates a compliance checklist, and emails an alert when the verdict is not Pass.

The system covers two phases: **pre-construction** (permits, licences, EIA approvals) and **post-construction** (inspection reports, completion and occupancy certificates).

---

## 2. Confirmed Tech Stack

Do NOT substitute these. They are already configured and partly built.

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js (App Router, JavaScript, not TypeScript)** | Handles both frontend and backend API routes in one project |
| Styling | **Tailwind CSS** | Already installed |
| Database + Auth | **Supabase (PostgreSQL)** | 6 tables already created (see §5) |
| File storage | **AWS S3** | Bucket already configured |
| OCR | **AWS Textract** (primary) | Tesseract documented as fallback |
| AI pipeline | **OpenAI GPT** | `gpt-3.5-turbo` in dev, upgrade to `gpt-4-turbo` for final evaluation |
| Email alerts | **Resend** | Domain `jeremiahalalade.me` verified; from-email `hey@jeremiahalalade.me` |
| Frontend deploy | **Vercel** | Free tier |
| Backend deploy | Consolidated into the Next.js Vercel deployment | No separate server |
| Version control | **GitHub** repo `docucheck-africa` | |

**Do not** introduce Express, Render, Nodemailer, SendGrid, Prisma, or a separate backend server. The architecture is intentionally consolidated into Next.js.

---

## 3. Project Structure (as built)

```
docucheck-africa/
├── app/
│   ├── api/
│   │   ├── auth/route.js          ✅ built & tested
│   │   ├── projects/route.js      ✅ built & tested
│   │   ├── documents/route.js     ✅ built & tested (the 9-step pipeline)
│   │   └── reports/route.js       ✅ built & tested
│   ├── dashboard/page.jsx         ⬜ to build
│   ├── projects/page.jsx          ⬜ to build
│   ├── upload/page.jsx            ⬜ to build
│   ├── alerts/page.jsx            ⬜ to build
│   ├── admin/page.jsx             ⬜ to build
│   ├── layout.js                  ⬜ to build (navbar shell)
│   └── page.js                    ⬜ to build (login/landing)
├── lib/
│   ├── services/
│   │   ├── ocrService.js          ✅ AWS Textract, confidence threshold
│   │   ├── gptService.js          ✅ classify, extract, detectAnomalies, generateNarrative
│   │   ├── ruleEngine.js          ✅ 6 deterministic checks
│   │   └── alertService.js        ✅ Resend HTML email
│   ├── supabaseClient.js          ✅ single client
│   └── config.js                  ✅ reads env vars
├── data/
│   └── requirementsMatrix.json    ✅ compliance rules for NG/GH/ZA
└── .env.local                     ✅ all keys set (not committed)
```

---

## 4. Environment Variables (`.env.local`)

```
NEXT_PUBLIC_APP_NAME=DocuCheck Africa
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://jfciwsscuwkiepneaerx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<set>
OPENAI_API_KEY=<set>
AWS_ACCESS_KEY_ID=<set>
AWS_SECRET_ACCESS_KEY=<set>
AWS_REGION=us-east-1
AWS_S3_BUCKET=<set>
RESEND_API_KEY=<set>
RESEND_FROM_EMAIL=hey@jeremiahalalade.me
```

Keys prefixed `NEXT_PUBLIC_` are browser-safe; all others are server-only and must never be exposed client-side.

---

## 5. Database Schema (Supabase — already created)

Six tables. RLS is **temporarily disabled** for development and **must be re-enabled before production** (policies already written and stored).

**profiles** — `id` (FK→auth.users), `full_name`, `role` (`user`|`admin`, default `user`), `organisation`, `created_at`. Auto-created on signup via `handle_new_user()` trigger.

**projects** — `id`, `name`, `description`, `jurisdiction` (`nigeria`|`ghana`|`south_africa`), `project_type` (`residential`|`commercial`|`industrial`|`infrastructure`), `status` (`pre_compliance`|`active`|`post_compliance`|`complete`, default `pre_compliance`), `user_id`, `created_at`, `updated_at`.

**documents** — `id`, `project_id` (FK, cascade), `file_name`, `file_url`, `document_type`, `status` (`pending`|`processing`|`verified`|`failed`), `extracted_fields` (JSONB), `verdict` (`pass`|`warning`|`fail`), `explanation`, `anomalies` (JSONB), `uploaded_by`, `uploaded_at`.

**compliance_checklist** — `id`, `project_id` (FK, cascade), `document_type`, `phase` (`pre_construction`|`post_construction`), `status` (`pending`|`submitted`|`verified`|`failed`), `document_id` (FK), `created_at`.

**audit_logs** — `id`, `project_id` (FK, cascade), `document_id` (FK), `action`, `performed_by`, `details` (JSONB), `created_at`.

**alerts** — `id`, `project_id` (FK, cascade), `document_id` (FK), `type` (`fail`|`warning`|`expiry`), `message`, `is_read` (default false), `created_at`.

---

## 6. The Nine-Step AI Pipeline (in `app/api/documents/route.js`)

This is the core contribution. The POST handler executes, in order:

1. **Upload** — receive file via `formData` (file, project_id, jurisdiction, phase, user_email)
2. **Validate** — allowed types: PDF, JPEG, PNG, JPG, DOCX; max 10MB
3. **Store** — `PutObjectCommand` to AWS S3, build `file_url`
4. **OCR** — `extractText(buffer)` via AWS Textract; compute average confidence; flag `isLowQuality` if < 70%
5. **Classify** — `classifyDocument(text)` → one of the document categories (§7)
6. **Extract** — `extractFields(text, type)` → 8 fields as JSON (§8)
7. **Rule check** — `checkCompliance(fields, jurisdiction, phase)` → 6 checks (§9) → verdict
8. **Anomaly detect** — `detectAnomalies(fields)` → GPT semantic review
9. **Persist** — insert into `documents`, update `compliance_checklist`, write `audit_logs`, insert `alerts` if not Pass, send Resend email if not Pass

Returns JSON: `{ success, document, classification, fields, compliance, anomalies, ocr }`.

---

## 7. Document Categories (8 core + jurisdiction-specific)

Core: `building_permit`, `safety_certificate`, `eia_approval`, `contractor_licence`, `insurance_certificate`, `inspection_report`, `completion_certificate`, `occupancy_approval`.

Jurisdiction-specific also classified: `coren_certificate` (NG), `nhbrc_enrolment` (ZA), `nhbrc_completion_certificate` (ZA), `final_inspection_report`, `structural_completion_certificate`, `fire_safety_certificate`.

---

## 8. Extracted Fields (8)

`document_type`, `issue_date` (YYYY-MM-DD), `expiry_date` (YYYY-MM-DD), `issuing_authority`, `holder_name`, `project_reference`, `jurisdiction`, `document_id`. Any not found → `null`.

---

## 9. Rule Engine Checks (6 deterministic)

1. **Expiry** — fail if expired; warning if ≤90 days; pass otherwise
2. **Mandatory fields** — issue_date, issuing_authority, holder_name must be present
3. **Issuing authority** — verify against approved authorities in `requirementsMatrix.json`
4. **Jurisdiction alignment** — document jurisdiction must match project jurisdiction
5. **Issue date not in future** — fail if issue_date > today
6. **Date sequence** — fail if expiry_date ≤ issue_date

Worst status wins: any fail → `fail`; any warning (no fail) → `warning`; else `pass`.

---

## 10. API Endpoints (built & tested)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth` | `action`: `register` / `login` / `logout` (Supabase Auth) |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project + auto-generate checklist from matrix |
| POST | `/api/documents` | Run the full 9-step pipeline |
| GET | `/api/documents?projectId=` | List documents for a project |
| GET | `/api/reports?projectId=` | Report summary (counts + checklist) |
| POST | `/api/reports` | Generate AI narrative for a project |

---

## 11. Frontend — What Remains To Build

Two roles only: **user** (full compliance features) and **admin** (everything + user management).

**Brand palette:**
- Primary dark: `#1a1a1a` (replaces the old navy `#0F2545` — use for nav bar, headers, primary buttons, logo mark background)
- White: `#FFFFFF` (backgrounds, cards, text on dark surfaces)
- Gold accent: `#E8A020` (logo mark, key CTAs, highlights)
- Verdict colours: green `#16A34A` (pass), amber `#D97706` (warning), red `#DC2626` (fail)

**Typography:** **PP Neue Corp** — use the *Compact* cut for display/headings and the *Normal* cut for body text. Self-host the licensed font files (PP Neue Corp is a licensed Pangram Pangram typeface — do not pull from Google Fonts).

**Icons:** **Hugeicons** (`hugeicons-react` package) for all UI icons — nav items, buttons, status indicators, empty states. Do not mix in emoji or other icon sets.

**Layout:** **Left sidebar** navigation (fixed, full height). Structure top to bottom:
- **Logo block** at top — "DocuCheck Africa" wordmark with the dark `#1a1a1a` mark and a collapse/toggle button
- **Grouped nav sections** with small uppercase grey labels:
  - `MAIN` → Dashboard, Projects, Compliance check
  - `REPORTS` → Reports, Alerts
  - `SYSTEM` → Admin (visible to admin role)
- **Active item** uses a `#1a1a1a` filled pill with white text and white icon; inactive items are `#1a1a1a` text/icon on white with a light hover state
- **User profile block pinned to the bottom** — avatar, full name, and role label (e.g. "Jeremiah Alalade · Admin")
- All icons from **Hugeicons**; main content area sits to the right of the sidebar on a white background

Pages to build and wire to the API:

| Page | Route | Calls |
|---|---|---|
| Login / landing | `app/page.js` | POST `/api/auth` |
| Navbar shell | `app/layout.js` | — |
| Dashboard | `app/dashboard/page.jsx` | GET `/api/projects`, GET `/api/documents` |
| Projects | `app/projects/page.jsx` | GET + POST `/api/projects` |
| Upload | `app/upload/page.jsx` | POST `/api/documents` (multipart) with 9-step progress UI |
| Alerts | `app/alerts/page.jsx` | query `alerts` table |
| Admin | `app/admin/page.jsx` | query `profiles` |

A working interactive HTML prototype of all pages already exists and should be matched closely for content and components (stat cards, project cards with progress bars, animated 9-step upload, checklist with Pre/Post/Audit tabs). **Note:** the final layout uses the left-sidebar navigation described above (per the approved Figma), not the top-nav used in the earlier prototype.

---

## 12. Evaluation Targets (for context)

Classification accuracy >90%; field extraction precision/recall >85%; compliance accuracy >88%; OCR WER <10%; processing <30s; alert delivery <5min; SUS >70 with 5 participants. Switch GPT model to `gpt-4-turbo` for the final 100-document run.

---

## 13. Constraints & Conventions

- JavaScript, not TypeScript. App Router. Import alias `@/*`.
- Wrap every external call (OpenAI, Textract, S3, Resend, Supabase) in try/catch; never crash the route.
- Use `gpt-3.5-turbo` during development to control cost.
- Never expose server-only env vars to the client.
- Re-enable Supabase RLS before any production deploy.
- Keep the AI pipeline logic in `lib/services/`; keep routes thin.
