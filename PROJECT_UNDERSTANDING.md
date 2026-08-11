# Spritle AI Discovery — Frontend Project Understanding

## Overview

A single-page React application that powers the **Spritle AI Readiness Discovery** platform. It walks clients through a multi-stage survey, collects answers, submits them to a Django REST backend, and presents a scored AI readiness report. A password-protected admin console lets the Spritle team manage sessions, leads, and the survey configuration.

---

## Tech Stack

| Concern | Library / Tool |
|---|---|
| UI framework | React 18 (JSX, no TypeScript) |
| Routing | React Router v6 |
| Server state | TanStack React Query v5 |
| Client state | Zustand |
| HTTP client | Axios (with interceptor-based token refresh) |
| Styling | CSS custom properties (design tokens) + Tailwind v4 (utility fallback) |
| Build tool | Vite 6 |
| Icons | Lucide React |
| Fonts | IBM Plex Sans · IBM Plex Mono · Newsreader (Google Fonts) |

---

## Project Structure

```
src/
├── main.jsx                  # React root mount
├── App.jsx                   # Router, silent token-refresh on load, ProtectedRoute
├── index.css                 # Design tokens + all shared CSS classes
│
├── api/
│   └── client.js             # Axios instance, request/response interceptors
│
├── stores/
│   ├── assessmentStore.js    # Survey progress state (Zustand)
│   └── authStore.js          # JWT access token (in-memory, Zustand)
│
├── hooks/
│   ├── useConfig.js          # Fetches /api/v1/config/ (survey schema)
│   └── useAuth.js            # useLogin / useLogout mutations
│
├── pages/
│   ├── Assessment.jsx        # Survey flow (main user-facing page)
│   ├── Results.jsx           # Report page after submission
│   ├── AdminLogin.jsx        # Admin sign-in form
│   └── AdminConsole.jsx      # Admin dashboard (Sessions / Leads / Config tabs)
│
├── components/
│   ├── SpritleLogo.jsx       # SVG wordmark; variant="color" | "white"
│   │
│   ├── survey/
│   │   ├── QuestionCard.jsx  # Renders answer input + collapsible note field
│   │   ├── StageNav.jsx      # Left sidebar stage navigator
│   │   ├── OptionPicker.jsx  # Single-select: row or grid layout
│   │   ├── MultiSelect.jsx   # Multi-select with optional max cap
│   │   ├── ScaleInput.jsx    # Labelled scale buttons (scored-4pt / choice-scale)
│   │   ├── OpenText.jsx      # Free-text textarea
│   │   └── OtpModal.jsx      # Email + OTP gate before unlocking the report
│   │
│   └── admin/
│       ├── SessionTable.jsx  # Paginated list of completed sessions
│       ├── SessionDetail.jsx # Slide-over panel with full session data + scores
│       ├── LeadList.jsx      # Contact leads from OTP verification
│       ├── ConfigManager.jsx # Full CRUD editor for stages and questions
│       └── ConfigEditor.jsx  # Sub-component used by ConfigManager
```

---

## Routing

| Path | Component | Auth required |
|---|---|---|
| `/` | `Assessment` | No |
| `/results/:sessionId` | `Results` | No (OTP gate inside) |
| `/admin/login` | `AdminLogin` | No |
| `/admin` | `AdminConsole` | Yes — `ProtectedRoute` |
| `*` | Redirects to `/` | — |

`ProtectedRoute` waits for `authReady` before rendering (prevents flash-redirect on refresh while the silent token-refresh is in flight).

---

## Authentication

```
Access token  → Zustand in-memory (authStore.accessToken)
                Never written to localStorage — XSS safe

Refresh token → httpOnly cookie set by backend
                Sent automatically via withCredentials: true
```

**Silent refresh on load** (`App.jsx`): on mount, `POST /api/v1/auth/refresh/` is called with the cookie. If it succeeds, the access token is stored in Zustand and `authReady` is set true. If it fails, `authReady` is still set true so the login redirect can happen.

**Interceptor-based retry** (`api/client.js`): on any 401, the interceptor attempts one token refresh and retries the original request. If the refresh itself fails, the token is cleared and the user is redirected to `/admin/login`.

---

## Survey Flow (Assessment.jsx)

1. **Config fetch** — `useConfig()` calls `GET /api/v1/config/` once with `staleTime: Infinity`. The response contains `stages[]`, each with `questions[]`.
2. **Visibility filtering** — `isVisible(q)` checks each question's `branch_on` field:
   - `"QX.Y:value"` format → show only if the referenced question's answer matches `value`
   - Cross-stage references → always visible (ordering hint only)
   - Plain key reference → visible once the parent question has any answer
3. **Navigation** — `assessmentStore` tracks `currentStageIndex` and `currentQuestionIndex`. Stage nav sidebar only allows jumping back to completed stages.
4. **Answer requirement** — Questions of type `choice-row`, `multi-select`, `choice-scale`, `scored-4pt` must be answered before Next is enabled (`canProceed` flag).
5. **Submission** — On the final question of the final stage, `POST /api/v1/sessions/` is called with `{ answers: [...] }`. On success, navigate to `/results/:id` and reset store.

### Progress bar

Two-colour SVG heartbeat line in the header:
- **Blue track** (`#15AED5`, 50% opacity) — full path, always visible, represents the remaining portion.
- **Green overlay** (`#82C341`) — clipped via SVG `<clipPath>` to the left `progressPct%` of the viewBox width. Expands left-to-right as questions are completed.

Progress formula:
```
completedCount = questions in all prior stages + currentQuestionIndex
progressPct    = round(completedCount / totalQuestions × 100)
```

---

## Question Types

| `question_type` | Component | Description |
|---|---|---|
| `choice-row` | `OptionPicker` (row) | Horizontal single-select buttons |
| `choice-grid` | `OptionPicker` (grid) | Card-grid single-select |
| `multi-select` | `MultiSelect` | Checkbox-style, optional `maxSelect` cap |
| `multi-select-ranked` | `MultiSelect` | Same UI, ranked intent |
| `choice-scale` / `scored-4pt` | `ScaleInput` | Labelled scale buttons |
| `open-scale` | `ScaleInput` | Same as above |
| `open-text` | `OpenText` | Free-text textarea |
| `open-number` | inline `<input type="number">` | Numeric entry |

Each question card also has a collapsible **"Add a note"** field (stored in `notesDict` in the assessment store and submitted alongside the answer).

---

## Report Page (Results.jsx)

Fetches `GET /api/v1/sessions/:id/` and renders:

1. **Score header** — Circular gauge + tier label + description. Tier mapped from `readiness_tier_label` (KB result) or `readiness_tier`.
2. **Metric boxes** — `automation_potential` (%) and `opportunity_index` — both come directly from the API; no frontend computation.
3. **Dimension Breakdown** — `dimension_scores[]` from API, rendered as progress bars.
4. **Industry AI Readiness** — `kb_result` block: overall score, section bars, key strengths / gaps / risks.
5. **Implementation Estimate** — cost range, payback window, complexity tier (from `kb_result`).
6. **AI Agents & Workflows Roadmap** — `kb_result.phase1_items`, `phase2_items`, `phase3_items`.
7. **Recommended AI Agents** — `agents[]`.
8. **Key Challenges** — `pain_flags[]`.
9. **Recommended Solutions** — `solutions[]`.
10. **Assessment Snapshot** — All answers grouped by stage (always starts on a new PDF page via `break-before: page`).

**OTP gate**: The full report is blurred until the user submits their email and verifies with an OTP (handled by `OtpModal`). Admin views bypass this with `?view=admin`.

**PDF print**: `window.print()` triggers `@media print` styles defined in `PRINT_STYLES`. Cards use `break-inside: avoid` at the item level (`print-item` class) so content doesn't split mid-card.

---

## Admin Console (AdminConsole.jsx)

Three tabs:

| Tab | Component | API endpoint |
|---|---|---|
| Sessions | `SessionTable` + `SessionDetail` | `GET /api/v1/admin/sessions/` |
| Leads | `LeadList` | `GET /api/v1/admin/leads/` |
| Config | `ConfigManager` | `GET/POST/PUT/DELETE /api/v1/config/stages/` |

`SessionDetail` slides in as an overlay panel showing scores, dimension bars, answers, and AI recommendations for a single session.

`ConfigManager` is a full CRUD editor — create/edit/delete stages and their questions, including option labels, score maps, branch conditions, and tags.

---

## Design System

All visual tokens are CSS custom properties in `src/index.css`:

```css
--ds-paper:      #EDF1F0   /* page background */
--ds-card:       #FFFFFF   /* card background */
--ds-ink:        #16232B   /* primary text / dark header bg */
--ds-ink-soft:   #55666D   /* secondary text */
--ds-ink-faint:  #93A3A8   /* placeholder / disabled text */
--ds-line:       #CBD8D6   /* borders */
--ds-line-soft:  #DEE7E6   /* subtle borders */
--ds-teal:       #1E7A6B   /* primary action / selected state */
--ds-teal-dark:  #175E53   /* hover on teal */
--ds-teal-soft:  #E1F1EC   /* selected background tint */
--ds-amber:      #DB9130   /* active stage indicator */
--ds-amber-soft: #F7E9D2   /* amber background tint */
```

**Spritle brand colours** (logo + progress bar only):
- `#15AED5` — Spritle blue
- `#82C341` — Spritle green

### Shared CSS classes

| Class | Purpose |
|---|---|
| `.ds-btn` / `.ds-btn-solid` / `.ds-btn-ghost` | Action buttons |
| `.ds-btn-xs` | Small inline action buttons |
| `.ds-option` | Single/multi-select option buttons |
| `.ds-scale-btn` | Scale answer buttons |
| `.ds-textarea` / `.ds-input` / `.ds-select` | Form inputs |
| `.ds-label` | Mono uppercase form labels |
| `.ds-tab` / `.is-active` | Admin tab bar |
| `.ds-table` | Data tables |
| `.ds-bar-track` / `.ds-bar-fill` | Progress bars |
| `.ds-content-card` | Card wrapper with border + radius |
| `.ds-section-heading` | Report section headings (Newsreader serif) |
| `.ds-sidebar` / `.ds-main` | Layout regions (scrollbar hidden) |
| `.print-item` | Prevents PDF page breaks mid-card |
| `.no-print` | Hidden during `window.print()` |
| `.font-newsreader` / `.font-plex-mono` | Typography helpers |

---

## API Endpoints (consumed by frontend)

| Method | Path | Used by |
|---|---|---|
| `GET` | `/api/v1/config/` | `useConfig` hook |
| `POST` | `/api/v1/sessions/` | Assessment submission |
| `GET` | `/api/v1/sessions/:id/` | Results page |
| `PATCH` | `/api/v1/sessions/:id/contact/` | OTP verification (save email + company) |
| `POST` | `/api/v1/auth/login/` | Admin login |
| `POST` | `/api/v1/auth/refresh/` | Silent token refresh |
| `GET` | `/api/v1/admin/sessions/` | Admin session list |
| `GET` | `/api/v1/admin/sessions/:id/` | Admin session detail |
| `GET` | `/api/v1/admin/leads/` | Admin leads list |
| `GET/POST/PUT/DELETE` | `/api/v1/config/stages/` | Config manager CRUD |

In development, Vite proxies `/api` → `http://localhost:8000`. In production, `VITE_API_URL` env var sets the backend base URL.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL (empty in dev — uses Vite proxy) |

---

## Key Architectural Decisions

- **JWT in memory, not localStorage** — eliminates XSS token theft. Page refresh triggers a silent refresh via the httpOnly cookie.
- **Config cached forever** (`staleTime: Infinity`) — survey schema doesn't change mid-session. Hard refresh picks up any admin config changes.
- **Branch logic is client-side** — `isVisible()` in `Assessment.jsx` filters questions per render based on current answers. The server receives all submitted answers; branching is presentational only.
- **No TypeScript** — project uses plain JSX throughout.
- **Tailwind as escape hatch** — Tailwind v4 is included but the primary styling is CSS custom properties + explicit class names. Tailwind utilities appear only for print utilities (`hidden print:block`) and one-off overrides.
