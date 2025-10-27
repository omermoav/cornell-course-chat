# Cornell Classes Q&A Chatbot

A web application that answers natural-language questions about Cornell classes using the official Cornell Class Roster API as the single source of truth.

## Overview

This application indexes all available Cornell Class Rosters and provides instant answers to questions about courses, including grading basis, credits, instructors, schedules, and historical offerings. All answers include provenance badges showing which roster term the data came from.

## Architecture

### Backend (Express + TypeScript)

**Core Services:**
- `cornell-api.ts`: Rate-limited API client (≤1 req/sec) with retry logic
- `ingestion.ts`: Service to fetch all rosters → subjects → classes and store locally
- `storage.ts`: In-memory storage interface for rosters, subjects, and courses
- `intent-parser.ts`: Deterministic parser to extract course codes (SUBJ ####) and detect question intent
- `answer-service.ts`: Combines parser + storage to answer questions with latest data and provenance

**API Endpoints:**
- `GET /api/ping` - Health check with storage stats
- `GET /api/rosters` - List all rosters
- `GET /api/classes/latest?subject=X&catalog_nbr=Y` - Get latest course offering
- `GET /api/classes/history?subject=X&catalog_nbr=Y` - Get course history across rosters
- `POST /api/ask` - Natural language question answering
- `POST /api/admin/ingest` - Start data ingestion (admin)
- `GET /api/admin/ingest/progress` - Check ingestion progress

### Frontend (React + Tailwind + Shadcn UI)

**Components:**
- `SearchInput`: Enhanced search with recent queries and example questions
- `AnswerCard`: Detailed course information with sectioned layout
- `ProvenanceBadge`: Shows which roster term the answer came from
- `StatusMessage`: Loading, error, not found, and policy message states
- `ThemeToggle`: Dark/light mode support

**Design System:**
- Cornell Carnelian Red (#B31B1B) as primary brand color
- Clean academic interface with modern polish
- Glass effects, gradients, and smooth animations
- Fully responsive with mobile-first approach

## Data Model

**Roster:** `{ slug, descr, year, termCode }` - Term ordering: WI(1) < SP(2) < SU(3) < FA(4)

**StoredCourse:** 
- Subject, catalogNbr, titleLong
- Grading basis, credits (min/max)
- Instructors, meeting patterns (if available)
- Last terms offered
- Roster slug & description for provenance

## Key Features

1. **Deterministic Intent Detection**
   - Grading basis: "pass/fail", "S/U", "letter", "grading"
   - Credits: "credits", "credit hours"
   - Instructor: "instructor", "professor"
   - Schedule: "time", "meet", "when"
   - History: "last offered", "history"
   - Syllabus: "syllabus" (deep links only, no PDF mirroring)
   - Pass rate: Special policy message (Cornell doesn't publish)

2. **Latest Data Resolution**
   - Ranks rosters by (year, termCode)
   - Always answers from most recent term with data
   - Shows "Note: Using most recent available data" if course not in latest roster

3. **Grading Basis Handling**
   - Maps API values to human-readable format
   - Detects section variations within same term
   - Shows "Varies by section" with list of bases

4. **Provenance & Compliance**
   - Every answer includes visible source badge
   - Deep links to official class roster pages
   - No syllabus PDF mirroring (NetID-gated)
   - Pass rate policy message per Cornell guidelines

## Development

**Start Development Server:**
```bash
npm run dev
```

**Trigger Data Ingestion:**
```bash
curl -X POST http://localhost:5000/api/admin/ingest
```

**Check Ingestion Progress:**
```bash
curl http://localhost:5000/api/admin/ingest/progress
```

## Testing

The application supports end-to-end testing with the following acceptance criteria:

1. "Is NBAY 5500 pass/fail?" → Returns grading basis + source + class link
2. "Credits for INFO 2950?" → Returns min-max credits + source
3. "Open syllabus for CS 4780?" → Returns class page link with NetID note
4. "Pass rate for ORIE 3500?" → Returns policy message + class link
5. Course only in older roster → Includes "Note: Using most recent available data"
6. Course doesn't exist → "may be new or no public data yet"

## Rate Limiting

Respects Cornell API guidance of ≤1 request/second using p-queue with exponential backoff on failures.

## Recent Changes

- Implemented full backend data ingestion pipeline
- Created deterministic intent parser for natural language queries
- Built answer service with latest-data resolution and provenance tracking
- Connected frontend to real API, removed all mock data
- Added Cornell branding with Carnelian Red primary color
- Enhanced UI with gradients, animations, and improved visual hierarchy
