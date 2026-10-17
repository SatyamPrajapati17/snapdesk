# 04 — UI FLOW + DESIGN SYSTEM: SNAPDESK (Brutalism)

Theme: **Neo-brutalism.** Poppins. Yellow, red, white, black. Thick borders, hard offset shadows, zero radius, loud type. Must be fully usable on every screen size.

## 1. Design tokens

### 1.1 Colors

| Token | Hex | Use |
|---|---|---|
| `--yellow` | `#FFD600` | Primary surfaces, primary buttons, highlights, nav active |
| `--yellow-soft` | `#FFF3A3` | Subtle fills, table zebra, hover |
| `--red` | `#E10600` | Danger, high risk, reject, alerts, accents |
| `--red-soft` | `#FFD9D6` | Error backgrounds |
| `--white` | `#FFFFFF` | Page and card background |
| `--black` | `#0A0A0A` | Text, borders, shadows |
| `--gray` | `#EDEDED` | Disabled, skeleton |
| `--green-ok` | `#00A650` | Success only (small badges/toasts; keep rare) |

Contrast rules: black on yellow and black on white (AAA). White on red only for bold text >= 16 px. Red text on white only for >= 16 px bold or as icon+text combos. Never yellow text on white.

### 1.2 Typography (Poppins)

Load with `next/font/google`: weights 400, 500, 600, 700, 800, 900.

| Style | Size (mobile / desktop) | Weight | Notes |
|---|---|---|---|
| Display | 36 / 64 px | 900 | UPPERCASE, tight leading 1.0 |
| H1 | 28 / 44 px | 800 | UPPERCASE |
| H2 | 22 / 32 px | 800 | |
| H3 | 18 / 22 px | 700 | |
| Body | 16 px | 400-500 | Line height 1.5. Never below 16 px for inputs (prevents iOS zoom) |
| Small | 14 px | 500 | Meta, captions |
| Label | 12-13 px | 700 | UPPERCASE, letter-spacing 0.06em |

### 1.3 Borders, shadows, spacing

- Border: `3px solid var(--black)` default; `4px` for cards/modals; `2px` for table cells.
- Radius: **0** everywhere.
- Shadow (hard offset, no blur): `--shadow-sm: 3px 3px 0 #0A0A0A`, `--shadow: 6px 6px 0 #0A0A0A`, `--shadow-lg: 10px 10px 0 #0A0A0A`. On mobile reduce one step.
- Spacing scale (4 px base): 4, 8, 12, 16, 24, 32, 48, 64.
- Page max width 1280 px, padding 16 px mobile / 32 px desktop.

### 1.4 Motion

- Interaction = mechanical: on hover, button translates `(-2px,-2px)` and shadow grows; on active, translates `(3px,3px)` and shadow collapses to 0 (looks pressed).
- Duration 80-120 ms, `steps` or linear easing. No fades/spring.
- Respect `prefers-reduced-motion` (disable translate transitions).

### 1.5 Tailwind config snippet

```js
// tailwind.config.ts
theme: {
  extend: {
    colors: { yellow: { DEFAULT:'#FFD600', soft:'#FFF3A3' }, red: { DEFAULT:'#E10600', soft:'#FFD9D6' }, ink:'#0A0A0A', ok:'#00A650', paper:'#FFFFFF', gray: { DEFAULT:'#EDEDED' } },
    fontFamily: { sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'] },
    borderRadius: { none:'0', DEFAULT:'0' },
    boxShadow: { hard:'6px 6px 0 #0A0A0A', 'hard-sm':'3px 3px 0 #0A0A0A', 'hard-lg':'10px 10px 0 #0A0A0A' },
    screens: { xs:'360px', sm:'640px', md:'768px', lg:'1024px', xl:'1280px', '2xl':'1536px' },
  }
}
```

## 2. Components (build in `components/ui/`)

| Component | Spec |
|---|---|
| **Button** | Variants: `primary` (yellow bg), `danger` (red bg, white text), `secondary` (white bg), `ghost` (underline only). 3px border, hard shadow, min height 48 px (44 px min tap), UPPERCASE bold label. States: hover/active/focus/disabled (gray, no shadow). Loading state with text "WORKING..." (no spinner required). |
| **Input / Textarea / Select** | White bg, 3px border, 48 px height, label above (Label style), helper text below, error = red border + red-soft bg + message. Focus: 4px yellow outline offset 2 px plus black border. |
| **Card** | White bg, 4px border, hard shadow. Optional colored header strip (yellow/red/black) with Label text. |
| **Badge** | Rectangular, 2px border, Label style. Status colors: yellow=pending, red=rejected/high, white=neutral, green-ok=approved (with check text, not color alone). |
| **Table** | 2px cell borders, header row black bg + white text (or yellow bg + black), zebra `yellow-soft`. **Below 768 px: transforms to stacked cards** (each row a Card with label/value pairs). |
| **Modal / Drawer** | Overlay black 60%. Panel 4px border, hard-lg shadow. Mobile: full-screen sheet from bottom. Focus trap, ESC closes, close button top-right 44 px. |
| **Tabs** | Heavy bordered segments; active = yellow fill. Horizontally scrollable on mobile. |
| **Toast** | Bottom-right desktop, bottom-center mobile, 4px border, auto-dismiss 5 s, `role="status"`. |
| **Skeleton** | Gray block with 3px border, optional diagonal stripe pattern. |
| **EmptyState** | Big icon-less typographic block with action. |
| **Marquee/Banner** | Yellow strip with black uppercase text for system notices (offline, mock mode). |
| **Stat tile** | Big number (Display style), label, border, color-coded background. |
| **RiskCard** | Left 12 px color bar (low=white, medium=yellow, high=red), severity badge, explanation, quoted source snippet in monospace-ish block (`font-mono` allowed only here), confidence meter (segmented bar). |
| **FileDrop / CameraCapture** | Dashed 4px border zone, big "SNAP / UPLOAD" buttons, preview with retake. Uses `<input type="file" accept="image/*,application/pdf" capture="environment">` on mobile. |

Icons: use `lucide-react` with `strokeWidth={3}` for a chunky look. Every icon-only button has `aria-label`.

## 3. Responsive rules (mandatory)

| Breakpoint | Layout |
|---|---|
| **< 640 (mobile)** | Single column. Bottom tab bar (fixed, 64 px, 4 items + More). Header slim with logo + notification bell + avatar. Tables -> cards. Modals full-screen. Buttons full width in forms. |
| **640-1023 (tablet)** | Two-column grids where useful. Collapsible left rail (icons + labels toggle). Tables with horizontal scroll container only if > 6 columns, else stacked. |
| **>= 1024 (desktop)** | Fixed left sidebar 260 px (black bg, yellow active item). Content max 1280. Drawer detail panels on right. |
| **>= 1536 (wide)** | Content centered, max width held; sidebar unchanged. |

Hard requirements:
- No horizontal page scroll at any width >= 320 px.
- Tap targets >= 44 x 44 px.
- Use `min-h-[100dvh]` (not `100vh`) for full-height layouts; respect safe-area insets (`env(safe-area-inset-bottom)`) for the bottom bar.
- Images `max-width:100%`; use `object-fit: contain` for document previews.
- Long text and emails `break-words`; tables never overflow the viewport.
- Test at 360x740, 390x844, 768x1024, 1280x800, 1920x1080 (Playwright).
- Works with keyboard only; visible focus; logical tab order.
- Text scales to 200% zoom without breaking layout.

## 4. Global shell

```
DESKTOP                                         MOBILE
+---------+---------------------------------+   +-------------------------+
| LOGO    |  [Search]   [bell] [avatar]     |   | SNAPDESK     [bell][me] |
| ------- |---------------------------------|   |-------------------------|
| Dash    |  PAGE TITLE (H1)                |   |  PAGE TITLE             |
| Scan    |  -----------------------------  |   |  content cards          |
| Docs    |  content                        |   |                         |
| Leaves  |                                 |   |                         |
| ...     |                                 |   |-------------------------|
| role tag|                                 |   | Home Scan Inbox Leave ..|
+---------+---------------------------------+   +-------------------------+
```

Header shows a **role tag** (ADMIN / MANAGER / EMPLOYEE) as a bordered badge, and a yellow **MOCK MODE** badge when `USE_MOCK=true`.

## 5. Screen specs

For each screen: purpose, key elements, responsive behavior.

### 5.1 Landing `/`
- Hero: Display text "SNAP IT. SOLVE IT." on yellow block, subtext, two buttons (LOGIN, SEE DEMO FLOW). Red diagonal sticker "POWERED BY GEMMA 4". Three feature cards (Scan, Approve, Pay). Footer with privacy note.
- Mobile: hero text 36 px, buttons stacked.

### 5.2 Login `/login`
- Card centered: email, password (live) / role buttons (mock). "Continue with Google" button (live later). Error state box.
- Mobile: card full width, no shadow offset beyond 3 px.

### 5.3 Dashboard `/dashboard` (role-based)
- **Employee:** stat tiles (Leave balance, Next deadline, Pending items), big "SNAP A DOCUMENT" CTA, onboarding checklist card if incomplete, recent documents, latest payslip tile.
- **Manager:** tiles (Pending approvals, On leave today, Team size), approvals preview list, team leave calendar (week strip).
- **Admin:** tiles (Headcount, Pending verifications, Contracts awaiting acceptance, Payroll status), quick actions (New employee, Run payroll), activity feed from audit.
- Grid: 1 col mobile, 2 col tablet, 3-4 col desktop.

### 5.4 Scan `/scan`
- Step 1: capture/upload zone with big buttons; tips list (good light, flat, all corners).
- Step 2: preview + quality warning + "ANALYZE" button.
- Step 3: analyzing state: full-width progress block with rotating status text ("READING...", "FINDING RISKS...", "EXTRACTING DATES...").
- Result (`/documents/[id]`): tabs Summary | Fields | Risks | Deadlines | Original. Sticky action bar (bottom on mobile): Create reminder, Draft email, Request review.
- Desktop: image preview left (sticky), analysis right. Mobile: image collapses into "View original" tab.

### 5.5 Documents `/documents`
- Filters (type, status, date), search, list as Table (desktop) / Cards (mobile). Row shows type badge, title, upload date, risk count (red badge), next deadline.

### 5.6 Approvals `/approvals`
- Tabs Pending | Decided | All. Cards with type badge, requester, summary, age. Actions inline (Approve green-outline? No: Approve = yellow primary, Reject = red danger). Detail drawer (desktop) / page (mobile). Verification detail shows two images side by side (stacked on mobile) + AI notes + disclaimer strip.

### 5.7 Leaves `/leaves`, `/leaves/new`
- Balance tiles per type. List of requests with status badges. Apply form (type select, date range, half-day toggle, reason). Team calendar (month grid on desktop, week list on mobile).

### 5.8 Payroll `/payroll`, `/payroll/[runId]` (admin)
- Runs list with status badges, totals. Run detail: summary tiles (Gross, Deductions, Net, Employees), employee table (cards on mobile), line-item edit modal, action bar (Mark reviewed, Publish with confirm, Export CSV).

### 5.9 Payslips `/payslips`
- Month list; detail with earnings and deductions columns (stacked on mobile), net amount in Display style on yellow block, Print button (print CSS: white bg, no shadows), "Explain this payslip" button opens Assistant prefilled.

### 5.10 Employees `/employees`, `/employees/new`, `/employees/[id]`
- List with search/filters. New: multi-step form (Basics -> Role & manager -> Salary -> Contract terms -> Review), progress indicator with numbered boxes. Profile tabs: Overview, Contract, Documents, Leave, Salary, Verification.

### 5.11 Contract `/contracts/[id]`
- Contract text in readable column (max 70ch), sticky acceptance panel (desktop right, mobile bottom sheet): typed name input, agree checkbox, ACCEPT button. Status banner.

### 5.12 Verify `/verify`
- Stepper (4 steps). Consent step uses plain language list. Camera view with framing overlay (CSS rectangle for ID, circle guide for selfie). Fallback upload. Review step. Final "SUBMITTED" state.

### 5.13 Assistant `/assistant`
- Chat bubbles: user = yellow block right, assistant = white block left with 3px border. Input bar fixed at bottom (above bottom nav on mobile). Chips scroll horizontally. "Steps" collapsible. Confirm cards for proposed actions (yellow header strip).

### 5.14 Notifications, Audit, Settings
- Notifications: list with unread yellow left bar, mark all read.
- Audit: filterable table -> cards on mobile; monospace for ids only.
- Settings: sections as cards (Profile, Company (admin), Integrations, Diagnostics (admin)).

### 5.15 System pages
- 403 "NOT YOUR ZONE", 404 "NOTHING HERE", 500 "SOMETHING BROKE" (each with red block and "BACK TO DASHBOARD").

## 6. Content and tone

- Short, blunt, uppercase headings. Plain-language body copy. No jargon in employee-facing text.
- Buttons are verbs: SNAP, ANALYZE, APPROVE, REJECT, PUBLISH, ACCEPT.
- AI-generated content gets a small "AI-SUGGESTED" badge and disclaimer where relevant ("Not legal advice", "Human review required").
- Dates shown `17 Oct 2026`; currency `Rs 45,000.00` (use the rupee symbol with Poppins; verify glyph renders, else fall back to "INR").

## 7. Accessibility checklist

- Semantic landmarks (`header`, `nav`, `main`), skip-to-content link.
- Form labels, `aria-describedby` for errors, `aria-live` for toasts and analysis progress.
- Status never by color alone (text + icon/shape).
- Focus ring: `outline: 4px solid #FFD600; outline-offset: 2px;` plus black border (on yellow buttons use `outline-color: #0A0A0A`).
- Camera features always have an upload alternative.
- Print stylesheet for payslip and contract.

## 8. CSS foundation (starter)

```css
:root{
  --yellow:#FFD600; --yellow-soft:#FFF3A3; --red:#E10600; --red-soft:#FFD9D6;
  --ink:#0A0A0A; --paper:#FFFFFF; --gray:#EDEDED; --ok:#00A650;
  --bw:3px;
}
html{ font-family:var(--font-poppins),system-ui,sans-serif; background:var(--paper); color:var(--ink); }
body{ min-height:100dvh; overflow-x:hidden; }
*{ border-radius:0 !important; }
.btn{ border:var(--bw) solid var(--ink); box-shadow:4px 4px 0 var(--ink); min-height:48px; padding:0 20px;
      font-weight:800; text-transform:uppercase; letter-spacing:.04em; transition:transform .1s, box-shadow .1s; }
.btn:hover{ transform:translate(-2px,-2px); box-shadow:6px 6px 0 var(--ink); }
.btn:active{ transform:translate(3px,3px); box-shadow:0 0 0 var(--ink); }
.btn:focus-visible{ outline:4px solid var(--ink); outline-offset:3px; }
@media (prefers-reduced-motion:reduce){ .btn{ transition:none; } .btn:hover,.btn:active{ transform:none; } }
@media (max-width:639px){ .card{ box-shadow:4px 4px 0 var(--ink); } }
```

## 9. UI definition of done (per screen)

- Matches tokens (no rounded corners, no blur shadows, Poppins only except `font-mono` in snippet blocks).
- Verified at 360, 768, 1280, 1920 px with no horizontal scroll.
- Loading, empty, error states implemented.
- Keyboard navigable; axe check has zero serious/critical violations.
- Role visibility correct.
