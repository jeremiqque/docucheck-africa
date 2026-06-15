# DocuCheck Africa — Design System
> compliance, made calm and legible

**Theme:** light

DocuCheck Africa renders as a precise, trustworthy workspace: a clean white canvas with near-black ink, one warm gold accent, and a disciplined set of status colours that only appear when a verdict is rendered. Typography is geometric and confident — PP Neue Corp Compact for headings, PP Neue Corp Normal for body — with Hugeicons providing a single consistent monolinear icon language. Surfaces layer as faint grey tints, borders are hairline thin, and components stay quiet: filled-dark primary buttons, outlined ghosts, soft pill radii, almost zero elevation. The system behaves like a regulator's well-kept ledger — orderly, deliberate, legible — where the only saturated moments are the gold call-to-action and the three compliance verdicts (pass, warning, fail).

---

## Colors

| Name | Value | Role |
|------|-------|------|
| Paper White | `#FFFFFF` | Page canvas, card surfaces, text on dark fills |
| Ink Black | `#1a1a1a` | Nav bar, headers, primary buttons, logo mark background, body text, ghost borders |
| Graphite | `#3F3F3F` | Secondary text, muted labels, inactive icon strokes |
| Slate Grey | `#6B7280` | Tertiary text, captions, placeholder text |
| Gold | `#E8A020` | Single chromatic accent — logo mark, key CTA highlights, active gold states |
| Gold Deep | `#C7861A` | Gold hover/pressed state |
| Mist | `#F6F7F9` | First elevated surface — section banding, table header rows |
| Cloud | `#EDEFF2` | Second surface tint, hairline dividers, pill borders |
| Fog | `#E2E5EA` | Tertiary surface, large decorative borders, muted frames |
| Pass Green | `#16A34A` | Verdict: pass — badge text, check icons, progress fills |
| Pass Wash | `#DCFCE7` | Verdict: pass — badge background, soft highlight |
| Warn Amber | `#D97706` | Verdict: warning — badge text, alert icons |
| Warn Wash | `#FEF3C7` | Verdict: warning — badge background |
| Fail Red | `#DC2626` | Verdict: fail — badge text, error icons |
| Fail Wash | `#FEE2E2` | Verdict: fail — badge background |

**Accent discipline:** Gold (`#E8A020`) is the only chromatic brand colour — use it for the logo mark and the single highest-emphasis highlight per view. The three verdict colours are *functional*, never decorative: they appear only on compliance status (badges, checklist circles, progress bars, alerts), never as page furniture.

---

## Typography

### PP Neue Corp Compact — Headings & display
The compact cut pulls letters together for a dense, engineered headline quality. Use for page titles, section headings, stat values, card titles, and the logo wordmark. Weight 500–700. Self-host the licensed files (Pangram Pangram) — do not load from Google Fonts.
- **Substitute (dev fallback only):** Inter Tight, system-ui
- **Weights:** 500, 600, 700
- **Sizes:** 18, 22, 28, 40, 52
- **Letter spacing:** -0.02em to -0.03em at display sizes

### PP Neue Corp Normal — Body & UI text
The normal cut for all running text — body copy, table cells, form labels, button text, nav items, descriptions. Weight 400 default, 500 for emphasis and nav items.
- **Substitute (dev fallback only):** Inter, system-ui
- **Weights:** 400, 500
- **Sizes:** 11, 12, 13, 14, 16
- **Line height:** 1.4–1.6

### Type Scale

| Role | Font / Cut | Size | Weight | Line Height | Tracking |
|------|-----------|------|--------|-------------|----------|
| display | Compact | 52px | 700 | 1.0 | -0.03em |
| h1 | Compact | 40px | 700 | 1.05 | -0.03em |
| h2 | Compact | 28px | 600 | 1.1 | -0.02em |
| h3 | Compact | 22px | 600 | 1.2 | -0.02em |
| stat-value | Compact | 28px | 700 | 1.0 | -0.02em |
| card-title | Compact | 18px | 600 | 1.2 | -0.01em |
| body | Normal | 16px | 400 | 1.6 | 0 |
| body-sm | Normal | 14px | 400 | 1.5 | 0 |
| label | Normal | 13px | 500 | 1.4 | 0 |
| caption | Normal | 12px | 400 | 1.4 | 0 |
| micro-label | Normal | 11px | 500 | 1.3 | +0.06em, UPPERCASE |

The `micro-label` (uppercase, tracked-out, Slate Grey) is the system's section annotation — used for the sidebar group headers (`MAIN`, `REPORTS`, `SYSTEM`) and field labels above values.

---

## Iconography

**Hugeicons** (`hugeicons-react`) is the single icon system. Monolinear, ~1.5px stroke, no fills. Never mix in emoji or another set.

| Use | Hugeicon (suggested name) |
|------|---------|
| Dashboard | `DashboardSquare01Icon` |
| Projects | `FolderLibraryIcon` |
| Compliance check | `CheckmarkBadge01Icon` |
| Reports | `DocumentValidationIcon` |
| Alerts | `Notification01Icon` |
| Admin | `UserMultipleIcon` |
| Upload | `CloudUploadIcon` |
| Pass verdict | `CheckmarkCircle02Icon` (Pass Green) |
| Warning verdict | `Alert02Icon` (Warn Amber) |
| Fail verdict | `CancelCircleIcon` (Fail Red) |
| Pending | `Time02Icon` (Slate Grey) |
| Settings | `Settings02Icon` |
| Logout | `Logout01Icon` |

Icon sizing: 20px in nav and buttons, 16px inline with text, 18px in stat cards. Active sidebar item: white icon on `#1a1a1a`; inactive: `#1a1a1a` icon on white.

---

## Spacing & Layout

**Base unit:** 8px · **Density:** comfortable

- **Sidebar width:** 240px (collapsible to 64px icon-rail)
- **Content max-width:** 1200px
- **Section gap:** 32–48px
- **Card padding:** 20–24px
- **Element gap:** 8–16px

### Border Radius

| Token | Value | Applies to |
|-------|-------|-----------|
| sm | 8px | inputs, small chips, images |
| md | 12px | cards, surfaces, buttons |
| lg | 16px | modals, large panels |
| pill | 9999px | tags, badges, status chips, avatars |

---

## Components

### Sidebar Navigation
**Role:** Primary navigation (fixed, full height)

White background, 240px wide, 1px Cloud right border. Top: logo block — `#1a1a1a` mark + "DocuCheck Africa" wordmark (Compact 18px/600) and a collapse toggle. Grouped nav with `micro-label` headers (`MAIN`, `REPORTS`, `SYSTEM`). **Active item:** `#1a1a1a` filled pill (radius md), white text + white Hugeicon. **Inactive:** `#1a1a1a` text/icon on white, hover fills Mist. Bottom: pinned user block — avatar (pill), name (label 13px/500), role (caption, Slate Grey).

### Primary Button (Filled)
**Role:** High-emphasis action — Create Project, Upload, Generate Report

Filled `#1a1a1a`, white text, 12px radius, 12px×20px padding, Normal 14px/500. Hover lifts to `#000000`. For the single most important conversion moment per view, an alternative **Gold CTA** may be used: Gold `#E8A020` fill, `#1a1a1a` text, hover Gold Deep.

### Ghost / Outlined Button
**Role:** Secondary action

Transparent fill, 1px `#1a1a1a` border, 12px radius, 10px×18px padding, Normal 14px/500, `#1a1a1a` text. Hover fills Mist.

### Stat Card
**Role:** Dashboard KPI (Total Projects, Documents Verified, Cleared, Alerts)

White surface, 1px Cloud border, 12px radius, 20px padding, no shadow. A 3px top accent strip signals category (gold for primary metric, Pass/Warn/Fail for status metrics). Micro-label (uppercase) for the metric name, stat-value (Compact 28px/700) for the number, caption (Slate Grey) for the sub-line.

### Project Card
**Role:** Project summary in grid

White surface, 1px Cloud border, 12px radius. Header: project name (card-title), jurisdiction + type (caption). Verdict badge top-right. Body: phase label + progress bar (rounded, fill colour = current verdict colour), then verified/pending counts. Hover: border → `#1a1a1a`, lift 2px.

### Verdict Badge
**Role:** Pass / Warning / Fail / Pending status pill

Pill radius. Pass → Pass Wash bg + Pass Green text; Warning → Warn Wash + Warn Amber; Fail → Fail Wash + Fail Red; Pending → Cloud bg + Slate Grey text. Leading dot in the same text colour. Normal 12px/500.

### Checklist Item
**Role:** Compliance checklist row (Pre / Post construction)

Row with a 20px status circle on the left (filled verdict colour with white Hugeicon, or hollow Cloud border for pending), document label (body-sm/500), sub-line (caption), verdict badge right. Rows separated by 1px Cloud dividers, no shadow.

### Upload Pipeline (9-step)
**Role:** Live document-processing feedback

Dashed Cloud drop zone (md radius) with `CloudUploadIcon` and format chips. On upload, a step list animates: each step is a row (`#1a1a1a` icon, body-sm label) cycling waiting → active (Mist bg) → done (Pass Wash bg, check icon). Ends on a result card headed by the verdict colour, then extracted fields (2-col) and the six rule-check rows.

### Micro-Label
**Role:** Section headers, field labels

Normal 11px/500, +0.06em tracking, UPPERCASE, Slate Grey. Used for sidebar groups and the label above every extracted field value.

### Card Surface
**Role:** Generic container

Paper White or Mist background, 1px Cloud or Fog border, 12px radius, 20–24px padding. The border defines the edge — not elevation. No shadow.

### Data Table
**Role:** Document lists, audit trail, user management

Mist header row with micro-labels; white body rows; 1px Cloud row dividers. Body-sm text, verdict badges inline. No vertical rules — horizontal hairlines only.

---

## Surfaces (layer order)

- **Canvas** (`#FFFFFF`) — page background
- **First Elevation** (`#F6F7F9` Mist) — section banding, table headers, hover states
- **Second Elevation** (`#EDEFF2` Cloud) — pill borders, dividers, drop zones
- **Third Elevation** (`#E2E5EA` Fog) — decorative frames, muted overlays

Never skip levels or invert the stack. Elevation is expressed through hairline borders and subtle grey tints, not shadows.

---

## Elevation

- **Cards & surfaces:** none (border-defined)
- **Active sidebar pill / primary button:** `rgba(26, 26, 26, 0.06) 0px 1px 2px` (optional, very subtle)
- **Modal/overlay only:** `rgba(26, 26, 26, 0.12) 0px 8px 24px`

The system is shadow-averse by design. Shadows appear only on true overlays (modals, dropdowns).

---

## Do's and Don'ts

### Do
- Use `#1a1a1a` for the nav/sidebar, headers, primary buttons, and logo mark background — it is the structural anchor colour
- Reserve Gold `#E8A020` for the logo mark and one highest-emphasis highlight per view
- Use the three verdict colours *only* for compliance status — badges, checklist circles, progress bars, alerts
- Set PP Neue Corp Compact for all headings/stat values, Normal for all body/UI text
- Use Hugeicons everywhere at consistent sizes; map verdicts to check-circle / alert / cancel-circle
- Define edges with 1px Cloud/Fog borders, not shadows
- Keep the sidebar active item as a `#1a1a1a` filled pill with white text + white icon
- Use the uppercase micro-label for sidebar groups and field labels

### Don't
- Don't reintroduce the old navy `#0F2545` anywhere — `#1a1a1a` replaces it entirely
- Don't use verdict colours as decoration, backgrounds, or page furniture
- Don't add drop shadows to cards; reserve shadow for modals/dropdowns only
- Don't mix emoji or a second icon set with Hugeicons
- Don't load PP Neue Corp from Google Fonts — self-host the licensed files
- Don't introduce new saturated colours (blues, purples, teals) outside this palette
- Don't use sharp 0px corners on interactive elements — min 8px inputs, 12px buttons/cards

---

## Layout

Fixed 240px left sidebar (collapsible) on a white canvas; main content area capped at 1200px with comfortable 32–48px section gaps. Dashboards lead with a row of stat cards, then a 2-column split (project grid + activity/alerts rail). Detail views use a project header block, a tab row (Pre-Construction / Post-Construction / Audit Trail), then checklist cards. The page breathes — orderly, legible, never information-packed. Banding is created with Mist surface tints rather than hard dividers.

---

## Brand Personality

| Trait | Expression |
|-------|-----------|
| Trustworthy | Near-monochrome ink-on-white, hairline borders, no visual noise |
| Precise | Compact headlines, tabular data, functional-only colour |
| African-built | Gold accent as the single warm signature; clean rather than ornamental |
| Calm authority | Restraint over decoration — the verdict is the loudest thing on screen |

## Similar Brands

- **Linear** — near-monochrome palette with a single accent, tight geometric type, hairline-border component design, shadow-averse
- **Vercel** — black/white discipline, large tight-tracked headlines, exactly one chromatic accent for emphasis
- **Stripe Dashboard** — calm data-dense surfaces, functional status colours, restrained elevation
- **Anthropic** — warm, contemplative restraint; the belief that serious tools should feel calm, not aggressive
