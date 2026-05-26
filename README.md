Overview
DocuCheck Africa is an AI-powered web application that automates the verification and management of construction compliance documentation for construction projects in Nigeria, Ghana, and South Africa.
The system addresses a critical gap in the African construction industry — the absence of any AI-assisted compliance management tool designed specifically for African regulatory frameworks. It covers both the pre-construction phase (permits, licences, EIA approvals) and the post-construction phase (inspection reports, completion certificates, occupancy approvals) within a single integrated platform.

Research Context
DetailInformationInstitutionOsun State University, OsogboDepartmentSoftware EngineeringFacultyComputing and Information TechnologyProgrammeB.Sc. Software EngineeringCourse CodeCSC 497 — Final Year ProjectAcademic Session2024/2025StudentAlalade Jeremiah Seyi (2023/50036)SupervisorMrs. Olukotun

Features
Pre-Construction Compliance

✅ Automated checklist generation based on jurisdiction (Nigeria, Ghana, South Africa)
✅ Document upload and AI-powered verification
✅ Pre-Commencement Clearance Report generation
✅ Project mobilisation blocked until all mandatory documents pass

Post-Construction Compliance

✅ Handover documentation checklist
✅ Defects liability period monitoring
✅ Audit package assembly on demand
✅ Post-Completion Compliance Certificate generation

AI Processing Pipeline

✅ OCR extraction using AWS Textract (primary) and Tesseract (fallback)
✅ Document classification into 8 compliance categories using GPT-4
✅ Structured data field extraction using GPT-4 few-shot prompting
✅ Compliance rule engine with 6 deterministic checks
✅ Anomaly detection using GPT-4 semantic reasoning
✅ Automated email alerts via Nodemailer and Gmail SMTP
✅ PDF audit report generation

Dashboard

✅ Real-time compliance status with colour-coded indicators
✅ Project-level compliance overview
✅ Document audit trail
✅ Role-based access control (Project Manager, Site Engineer, Compliance Officer, Administrator)
✅ Mobile-responsive design


System Architecture
DocuCheck Africa follows a five-layer modular architecture:
┌─────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                  │
│         React.js + Tailwind CSS (Vercel)            │
│   Dashboard · Upload · Projects · Reports · Alerts  │
└─────────────────────┬───────────────────────────────┘
                      │ REST API calls
┌─────────────────────▼───────────────────────────────┐
│                 APPLICATION LAYER                   │
│           Node.js + Express (Render.com)            │
│     JWT Auth · Business Logic · API Routing         │
└──────┬──────────────┬──────────────┬────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼───────────────┐
│  AI PROCESSING LAYER        │ │    DATA LAYER       │
│  AWS Textract (OCR)         │ │  Supabase           │
│  OpenAI GPT-4 (LLM)         │ │  PostgreSQL         │
│  Compliance Rule Engine     │ │  Audit Trail        │
│  Anomaly Detection          │ └────────────────────┘
└─────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│               INFRASTRUCTURE LAYER                  │
│   AWS S3 (Storage) · Nodemailer (Email)             │
│   ReportLab (PDF) · Render.com (Hosting)            │
└─────────────────────────────────────────────────────┘

AI Processing Pipeline
DocuCheck Africa processes every uploaded document through a nine-step AI pipeline:
Step 1 → Upload        User submits PDF, JPEG, PNG, or DOCX
Step 2 → Validate      Format and size check
Step 3 → Store         Save to AWS S3 with unique reference ID
Step 4 → OCR           AWS Textract extracts text (Tesseract fallback)
Step 5 → Classify      GPT-4 zero-shot → 8 document categories
Step 6 → Extract       GPT-4 few-shot → 8 structured data fields (JSON)
Step 7 → Rule Check    6 compliance checks → Pass / Warning / Fail
Step 8 → Anomaly       GPT-4 semantic consistency review
Step 9 → Alert/Report  Nodemailer alert + ReportLab PDF generation
Eight Document Categories

Building Permit
Safety Certificate
Environmental Impact Assessment (EIA)
Contractor Licence
Insurance Certificate
Inspection Report
Completion Certificate
Occupancy Approval

Eight Extracted Data Fields

Document type
Issue date
Expiry date
Issuing authority
Certificate holder name
Project reference number
Jurisdiction
Document unique identifier

Six Compliance Rule Engine Checks

Expiry date validation
Mandatory field presence
Issuing authority verification
Cross-document consistency
Certificate number format
Jurisdiction alignment


Tech Stack
CategoryTechnologyPurposeFrontendReact.js 18+Compliance dashboard UIStylingTailwind CSSResponsive designBackendNode.js + Express.jsREST API and AI pipelineDatabaseSupabase (PostgreSQL)Data persistence and authFile StorageAWS S3Secure document storageOCR PrimaryAWS TextractML-powered text extractionOCR FallbackTesseract.jsLow-quality document handlingAI EngineOpenAI GPT-4 TurboClassification, extraction, reasoningEmail AlertsNodemailer + Gmail SMTPAutomated compliance notificationsPDF ReportsPDFKitAudit-ready report generationAuthenticationSupabase AuthJWT-based user managementFrontend DeployVercelFree frontend hostingBackend DeployRender.comFree Node.js hostingVersion ControlGit + GitHubSource code management

Project Structure
docucheck-africa/
│
├── backend/                          ← Node.js + Express API
│   ├── server.js                     ← Entry point
│   ├── config.js                     ← Environment configuration
│   ├── supabaseClient.js             ← Supabase connection
│   ├── .env                          ← Environment variables (not committed)
│   ├── package.json
│   │
│   ├── routes/                       ← API endpoint handlers
│   │   ├── auth.js                   ← Authentication routes
│   │   ├── projects.js               ← Project management routes
│   │   ├── documents.js              ← Document upload and processing
│   │   └── reports.js                ← Report generation routes
│   │
│   ├── services/                     ← Business logic
│   │   ├── ocrService.js             ← AWS Textract + Tesseract OCR
│   │   ├── gptService.js             ← OpenAI GPT-4 classification and extraction
│   │   ├── ruleEngine.js             ← African compliance rule checking
│   │   ├── alertService.js           ← Nodemailer email alerts
│   │   └── reportService.js          ← PDFKit report generation
│   │
│   ├── middleware/
│   │   └── auth.js                   ← JWT authentication middleware
│   │
│   └── data/
│       └── requirementsMatrix.json   ← African compliance requirements
│
├── frontend/                         ← React.js dashboard
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         ← Main compliance dashboard
│   │   │   ├── Projects.jsx          ← Project management
│   │   │   ├── Upload.jsx            ← Document upload interface
│   │   │   ├── Reports.jsx           ← Report generation
│   │   │   └── Login.jsx             ← Authentication
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ComplianceCard.jsx
│   │   │   ├── DocumentList.jsx
│   │   │   ├── AlertBanner.jsx
│   │   │   └── VerdictBadge.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js                ← All API calls to backend
│   │   │
│   │   └── App.jsx
│   └── package.json
│
└── README.md

Prerequisites
Make sure you have the following installed:

Node.js 18+
Git
VS Code (recommended)

You also need accounts on:

Supabase — database and authentication
OpenAI — GPT-4 API access
AWS — S3 and Textract
Gmail — email alerts via Nodemailer