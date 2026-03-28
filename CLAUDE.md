# Bureaucracy Buster

An AI agent that navigates government paperwork on behalf of everyday people. Tell it a life event — "I'm moving to Texas," "my mother passed away," "I'm starting an LLC" — and it identifies every form you need across every agency, pre-fills them, tracks deadlines, and handles follow-ups.

## Vision

The consumer side of government automation is virtually nonexistent. AI handles less than 3% of complex government tasks. This tool closes the gap by acting as a personal bureaucracy navigator that knows federal, state, and local requirements.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Next.js 14 (App Router)
- **UI:** React + Tailwind CSS + shadcn/ui
- **Database:** SQLite via better-sqlite3 (local-first, no cloud dependency for MVP)
- **AI:** Claude API (Anthropic SDK) for reasoning, form analysis, and document generation
- **PDF:** pdf-lib for form filling, pdf-parse for reading government PDFs
- **Auth:** None for MVP (local app)

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Main dashboard — life event input
│   ├── events/
│   │   └── [id]/
│   │       └── page.tsx    # Event detail — checklist of forms/tasks
│   └── api/
│       ├── events/         # CRUD for life events
│       ├── forms/          # Form identification + prefill
│       └── research/       # Agency/requirement lookup
├── components/
│   ├── LifeEventInput.tsx  # Natural language input + suggestions
│   ├── FormChecklist.tsx   # Checklist of required forms per event
│   ├── FormViewer.tsx      # Preview/fill individual forms
│   ├── DeadlineTracker.tsx # Timeline of upcoming deadlines
│   └── StatusBadge.tsx     # Form status (not started / in progress / filed / confirmed)
├── lib/
│   ├── ai/
│   │   ├── agent.ts        # Core Claude agent — determines what forms are needed
│   │   ├── prefill.ts      # Auto-fills forms from user profile data
│   │   └── research.ts     # Researches agency requirements via web search
│   ├── db/
│   │   ├── schema.ts       # SQLite schema definitions
│   │   ├── events.ts       # Life event queries
│   │   ├── forms.ts        # Form tracking queries
│   │   └── profile.ts      # User profile data (name, SSN last 4, address, etc.)
│   ├── forms/
│   │   ├── registry.ts     # Known government forms database
│   │   ├── pdf-fill.ts     # PDF form filling engine
│   │   └── validators.ts   # Form field validation (SSN format, EIN, dates, etc.)
│   └── agencies/
│       ├── federal.ts      # IRS, SSA, USCIS, etc.
│       ├── state.ts        # State-specific agencies and requirements
│       └── local.ts        # County/city requirements
├── data/
│   ├── life-events.json    # Catalog of common life events and their form requirements
│   └── agencies.json       # Agency contact info, URLs, form indexes
└── types/
    └── index.ts            # TypeScript type definitions
```

## Data Model

```
UserProfile: { id, name, dob, ssn_last4, address, state, phone, email, created_at }
LifeEvent:   { id, type, description, state, status, created_at }
FormTask:    { id, event_id, form_name, agency, url, status, deadline, notes, prefill_data }
Deadline:    { id, form_task_id, due_date, reminder_sent, description }
```

## Build Phases

### Phase 1 — Scaffold + Core UI (Build First)
1. Initialize Next.js project with TypeScript, Tailwind, shadcn/ui
2. Set up SQLite database with schema
3. Build the dashboard page with life event input
4. Build the event detail page with form checklist
5. Create the user profile setup flow (collects reusable data for prefilling)
6. Wire up basic CRUD API routes

### Phase 2 — AI Brain
1. Integrate Claude API via Anthropic SDK
2. Build the research agent: given a life event + state, determine all required forms
3. Build the form registry: map form names to agency URLs and PDF downloads
4. Build the prefill engine: auto-populate form fields from user profile
5. Add deadline calculation (e.g., "must file within 30 days of move")

### Phase 3 — PDF Engine
1. Integrate pdf-lib for filling government PDF forms
2. Build form field mapping (Claude reads the PDF, maps user data to fields)
3. Add validation layer (SSN format, date formats, required fields)
4. Generate filled PDFs for download/print

### Phase 4 — Smart Features
1. Add progress tracking with status badges
2. Add deadline notifications/reminders
3. Add "what's next" suggestions based on current progress
4. Add form dependency detection ("you need Form A approved before filing Form B")

### Phase 5 — Polish + Viral Features
1. Side-by-side comparison: "time without Bureaucracy Buster vs. with"
2. Shareable completion certificates ("I conquered the DMV in 11 minutes")
3. Life event templates with community contributions
4. Export full audit trail as PDF

## Key Life Events to Support (MVP)

1. **Moving to a new state** — DMV, voter registration, tax withholding, utilities, mail forwarding
2. **Starting a business (LLC)** — Articles of organization, EIN, state tax registration, business license, DBA
3. **Death of a family member** — Death certificate copies, Social Security notification, probate, insurance claims, account closures
4. **Having a baby** — Birth certificate, SSN application, insurance enrollment, tax withholding update, FMLA
5. **Getting married** — Name change (SSN, DMV, passport), tax filing status, insurance, beneficiary updates
6. **Buying a home** — Title, deed, homestead exemption, property tax, insurance, utilities, address changes
7. **Immigration event** — USCIS forms, work authorization, SSN, state ID, tax obligations

## Coding Standards

- Use TypeScript strict mode everywhere
- Server Components by default, Client Components only when needed (forms, interactivity)
- API routes return consistent `{ data, error }` shape
- All Claude API calls go through `lib/ai/` — never call the SDK directly from components or routes
- Use Zod for input validation on all API routes
- Keep components under 150 lines — extract logic into hooks or lib functions
- SQLite queries in `lib/db/` only — no raw SQL in routes or components

## Environment Variables

```
ANTHROPIC_API_KEY=       # Required — Claude API key
DATABASE_PATH=./data/bureaucracy.db
```

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint check
```
