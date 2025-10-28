# Cornell Classes MECE Q&A Chatbot

A comprehensive web application that answers natural-language questions about Cornell classes using the official Cornell Class Roster API as the single source of truth. This is a MECE (Mutually Exclusive, Collectively Exhaustive) chatbot that displays ALL available course information automatically without requiring users to click external links.

## Overview

This application indexes all available Cornell Class Rosters and provides instant, comprehensive answers about courses. When you ask about a course, you get EVERYTHING: description, grading, credits, instructors, schedules, prerequisites, learning outcomes, distribution requirements, and historical offerings—all displayed beautifully in one place.

## MECE Design Philosophy

**Mutually Exclusive**: Information is organized into distinct sections with no overlap:
- Basic Info (description, credits, grading)
- Schedule & Instructors
- Requirements & Restrictions (prerequisites, permissions, forbidden overlaps)
- Learning Outcomes
- Distribution & Requirements (breadth, distribution categories, what it satisfies)
- Offering History

**Collectively Exhaustive**: Every available data field from Cornell's API is captured and displayed when available.

## Architecture

### Backend (Express + TypeScript)

**Core Services:**
- `cornell-api.ts`: Rate-limited API client (≤1 req/sec) with retry logic
- `ingestion.ts`: Comprehensive data extraction from all rosters → subjects → classes, capturing ALL catalog fields
- `storage.ts`: In-memory storage for complete course metadata
- `intent-parser.ts`: Enhanced parser detecting course codes and question intent (prerequisites, outcomes, requirements, etc.)
- `answer-service.ts`: Returns complete course information with latest data and provenance

**API Endpoints:**
- `GET /api/ping` - Health check with storage stats
- `GET /api/rosters` - List all rosters
- `GET /api/classes/latest?subject=X&catalog_nbr=Y` - Get latest course offering
- `GET /api/classes/history?subject=X&catalog_nbr=Y` - Get course history
- `POST /api/ask` - Comprehensive natural language question answering
- `POST /api/admin/ingest` - Start data ingestion
- `GET /api/admin/ingest/progress` - Check ingestion progress

### Frontend (React + Tailwind + Shadcn UI)

**Components:**
- `SearchInput`: Enhanced search with recent queries and example questions
- `AnswerCard`: **Comprehensive display** with all course information in beautiful sectioned layout
- `ProvenanceBadge`: Shows which roster term the answer came from
- `StatusMessage`: Loading, error, and not found states
- `ThemeToggle`: Dark/light mode support

**Design System:**
- Cornell Carnelian Red (#B31B1B) as primary brand color
- Clean academic interface with modern polish
- Glass effects, gradients, smooth animations
- Fully responsive mobile-first design

## Comprehensive Data Model

**StoredCourse includes:**
- **Basic**: subject, catalogNbr, titleLong, description
- **Grading**: gradingBasis, unitsMinimum, unitsMaximum
- **Schedule**: instructors[], meetingPatterns[]
- **Requirements**: prerequisites, permissionRequired, forbiddenOverlaps[]
- **Learning**: outcomes, satisfiesRequirements
- **Distribution**: breadthRequirements, distributionCategories
- **History**: lastTermsOffered

## Enhanced Intent Detection

Supports comprehensive question types:
1. **description**: "Tell me about", "What is", "Describe"
2. **prerequisites**: "Prerequisites", "prereq", "coreq", "requirements"
3. **outcomes**: "Learning outcomes", "What will I learn", "Course objectives"
4. **requirements**: "Breadth", "Distribution", "What does it satisfy"
5. **grading**: "Pass/fail", "S/U", "Letter", "Grading basis"
6. **credits**: "How many credits", "Credit hours"
7. **instructor**: "Who teaches", "Professor", "Instructor"
8. **schedule**: "When does it meet", "Class times", "Schedule"
9. **history**: "Last offered", "Offering history", "Previous terms"
10. **general**: Comprehensive view of everything

## Key Features

1. **Comprehensive Information Display**
   - ALL available data shown automatically in answer card
   - No need to click external links for basic information
   - Beautiful sectioned layout with icons and clear hierarchy
   - Information only shown if available (no empty sections)

2. **MECE Organization**
   - Course Description section
   - Quick Facts grid (Credits, Grading Basis)
   - Schedule & Instructors section
   - Requirements & Restrictions section (prerequisites, permissions, forbidden overlaps)
   - Learning Outcomes section
   - Distribution & Requirements section
   - Offering History section
   - Single external link to official Cornell Class Roster (for verification and NetID-gated content)

3. **Latest Data Resolution**
   - Ranks rosters by (year, termCode)
   - Always answers from most recent term with data
   - Shows "Note: Using most recent available data" if course not in latest roster

4. **Grading Basis Handling**
   - Maps API values to human-readable format
   - Detects section variations within same term
   - Shows "Varies by section" with list of bases

5. **Provenance & Compliance**
   - Every answer includes visible source badge
   - Deep links to official class roster pages
   - No syllabus PDF mirroring (NetID-gated)

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

The application supports end-to-end testing with comprehensive verification:

1. Comprehensive course information display (all sections)
2. Intent detection for various question types
3. Dark/light mode theme toggle
4. Responsive design and mobile functionality
5. Error handling and edge cases
6. Recent searches and example questions

## Rate Limiting

Respects Cornell API guidance of ≤1 request/second using p-queue with exponential backoff on failures.

## Recent Changes (Latest: MECE Comprehensive Chatbot)

- ✅ **MAJOR**: Transformed into MECE chatbot that displays ALL course information automatically
- ✅ Enhanced schema with comprehensive catalog fields: description, prerequisites, outcomes, requirements, breadth, distribution
- ✅ Updated ingestion to extract ALL available course metadata from Cornell API
- ✅ Redesigned AnswerCard UI with beautiful sectioned layout showing everything
- ✅ Enhanced intent parser to detect prerequisites, outcomes, requirements questions
- ✅ Removed separate "View Syllabus" link (NetID-gated content not needed for basic info)
- ✅ Single "View on Official Cornell Class Roster" button for verification
- ✅ Comprehensive end-to-end testing completed - all functionality verified

## Implementation Status

**Backend**: ✅ Complete & Comprehensive
- Cornell API client with rate limiting
- Full data ingestion with ALL catalog fields
- Enhanced intent parser (10 intent types)
- Comprehensive answer service
- REST API endpoints fully functional

**Frontend**: ✅ Complete & Comprehensive
- React SPA with Cornell branding
- Comprehensive answer cards with sectioned layout
- All course data displayed automatically
- Enhanced intent-aware responses
- Dark/light mode support
- Fully responsive MECE design

**Testing**: ✅ Complete
- End-to-end playwright tests passed
- UI interactions verified
- Theme toggle validated
- Error handling tested
- No console errors or crashes

## What Makes This MECE

**Mutually Exclusive Sections:**
- No information appears in multiple sections
- Each section has a distinct purpose
- Clear visual separation between categories

**Collectively Exhaustive Coverage:**
- Every API field is captured during ingestion
- Every field is displayed when available
- No hidden information requiring external clicks
- Comprehensive view of course from single glance

## Known Limitations

1. **Data Ingestion Time**: Full ingestion of all 46 rosters takes several hours due to 1 req/sec rate limit
2. **In-Memory Storage**: Data cleared on server restart (restart ingestion if needed)
3. **Historical Data**: Ongoing ingestion means more courses become available over time

## User Experience

**Before (Old Design):**
- Basic answer with link to syllabus
- Users had to click external links to see details
- Limited information shown directly

**After (MECE Design):**
- Comprehensive answer with ALL information
- Everything displayed beautifully in one card
- External link only for official verification
- MECE organization: no overlap, complete coverage
- Beautiful sectioned layout with icons and visual hierarchy
