# Cornell Classes MECE Q&A Chatbot

## Overview

This project is a comprehensive web application designed to answer natural-language questions about Cornell classes. It utilizes the official Cornell Class Roster API as its single source of truth, aiming to provide a Mutually Exclusive, Collectively Exhaustive (MECE) display of all available course information without requiring users to navigate external links. The application indexes all available Cornell Class Rosters to offer instant, comprehensive answers, presenting details like description, grading, credits, instructors, schedules, prerequisites, learning outcomes, distribution requirements, and historical offerings in a single, unified view.

## User Preferences

I prefer simple language and detailed explanations. I want iterative development and for you to ask before making major changes. Do not make changes to the folder `Z`. Do not make changes to the file `Y`.

## System Architecture

The application is built with a backend using Express and TypeScript, and a frontend using React, Tailwind CSS, and Shadcn UI.

**UI/UX Decisions:**
- **Design System**: Employs Cornell Carnelian Red (#B31B1B) as the primary brand color. The interface is clean, academic, and modern, featuring glass effects, gradients, smooth animations, and a fully responsive mobile-first design.
- **Search Experience**: Features a premium search input with animated focus effects, categorized example questions, recent searches, and clear visual feedback. Minimal red circular search button positioned on the left side.
- **Answer Display**: `AnswerCard` component provides a comprehensive, sectioned layout for course information, with an AI-generated summary at the top. `ProvenanceBadge` indicates the data source.
- **MECE Design Philosophy**: Information is organized into distinct, non-overlapping sections (Basic Info, Schedule & Instructors, Requirements & Restrictions, Learning Outcomes, Distribution & Requirements, Offering History) ensuring all available data fields are captured and displayed.
- **True MECE Chatbot**: Handles ANY question type - specific courses, broad queries, thematic questions, and even unrelated questions with helpful guidance back to Cornell courses.

**Technical Implementations & Feature Specifications:**
- **Backend Services**: Includes a rate-limited `cornell-api.ts` client (≤1 req/sec), `ingestion.ts` for comprehensive data extraction, `storage.ts` for in-memory data with title search, `intent-parser.ts` for detecting various query types, and `ai-service.ts` for OpenAI integration with MECE-focused broad question handling.
- **API Endpoints**: Key endpoints include `/api/ask` for natural language questions, `/api/classes/latest` and `/api/classes/history` for course data, and `/api/admin/ingest` for data ingestion, including a priority ingestion endpoint for Cornell Tech courses.
- **Comprehensive Data Model**: Stores detailed course information including subject, catalog number, title, description, grading basis, units, instructor details, meeting patterns, prerequisites, learning outcomes, and offering history.
- **Enhanced Intent Detection**: Supports a wide range of question types (e.g., description, prerequisites, outcomes, grading, credits, schedule, history), providing targeted answers and smart suggestions.
- **AI-Powered Conversational Answers**: Utilizes OpenAI GPT-4o-mini to generate contextual, factual answers based *only* on course data, displayed prominently with visual distinction.
- **AI Suggestions System**: When direct answers aren't available (broad queries, missing data), AI generates helpful clickable suggestions to guide users.
- **Search Capabilities**: Allows searching by course code (e.g., "NBAY 6170") or course title (e.g., "Designing & Building AI Solutions"), including partial title matching.
- **Data Resolution**: Always answers from the most recent available roster, with clear indication if data is not from the absolute latest term.
- **Grading Basis Handling**: Maps API values to human-readable formats (e.g., "GRI" to "Letter Grades (A+, A, A-, B+, B, B-, C+, C, etc.)").

## Key Features

### 1. Conversational Chat Interface ✨ NEW
- **Full conversation support**: Ask follow-up questions that maintain context from previous exchanges
- **Chat-style UI**: Messages displayed in scrollable conversation view with user/assistant distinction
- **Context awareness**: AI remembers previous questions and answers in the conversation
- **Persistent input**: Search field always visible for immediate follow-ups
- **Auto-scroll**: Automatically scrolls to newest message for seamless conversation flow
- **Clear conversation**: Option to start fresh conversation when needed
- **Example flow**: "What is NBAY 6170?" → "Who teaches it?" → "What are the prerequisites?"

### 2. True MECE Chatbot - Handles ANY Question Type
- **Specific course queries**: "What is NBAY 6170?" → Full course details with comprehensive AI summary
- **Broad subject queries**: "What CS courses are offered?" → AI suggestions for specific courses to explore
- **Thematic questions**: "Tell me about machine learning courses" → AI answer with helpful suggestions
- **Grading questions**: "Is CS 4780 pass/fail?" → Human-readable grading information
- **Prerequisites, schedules, outcomes**, etc. → Targeted answers from course data
- **General questions**: Even unrelated queries get helpful responses guiding users back to Cornell course info
- **Smart suggestions**: When direct answers aren't available, AI generates clickable follow-up questions
- **Suggestion cards**: Click any suggestion to instantly trigger a new search

### 3. AI-Powered Conversational Answers
- OpenAI GPT-4o-mini generates contextual, conversational responses
- AI answers appear prominently at top of answer card
- **Factual and specific**: Uses ONLY actual course data without generic interpretations
- Example: "NBAY 6170 is taught by Lutz Finger" (not "typically taught by...")
- Directly addresses the user's specific question
- Gradient background with sparkles icon for visual distinction
- **Broad question handling**: New `handleBroadQuestion()` method provides MECE-focused guidance

### 4. Search by Course Code OR Course Title
- Search by course code: "NBAY 6170", "CS 4780"
- **Search by course name**: "Designing & Building AI Solutions", "Introduction to Machine Learning"
- **Search by partial title**: "Building AI Solutions" finds full course
- Smart matching: exact matches prioritized, then starts-with, then contains
- Single match: instant answer; multiple matches: shows options

### 5. User-Friendly Grading Display
- Technical codes replaced with plain language:
  - "GRI" → "Letter Grades (A+, A, A-, B+, B, B-, C+, C, etc.)"
  - "SUI" → "Satisfactory/Unsatisfactory (S/U)"
  - "OPT/OPI" → "Student Option (choose Letter Grades or S/U)"
- Shared utility: `formatGradingBasis()` in `shared/grading-utils.ts`
- Automatically detects section variations within same term

### 6. Comprehensive Information Display
- ALL available data shown automatically in answer card
- No need to click external links for basic information
- Beautiful sectioned layout with icons and clear hierarchy
- Information only shown if available (no empty sections)

### 7. Enhanced Search UX
- Minimal red circular search button on left side
- Animated focus effects and gradient border
- Categorized example questions showcasing full capabilities
- Recent searches for quick re-access
- Clickable input field with perfect vertical centering

## Recent Changes

**October 28, 2025 - Conversational Chat Interface:**
- Implemented full conversational chat interface replacing single Q&A pattern
- Added `ChatMessage` and `ConversationRequest` types to schema for conversation history tracking
- Updated backend AI service to accept and utilize conversation history in responses
- Transformed frontend into scrollable chat interface with message display and auto-scroll
- Modified API endpoints to accept conversation history array with each request
- User messages displayed in right-aligned red boxes, assistant messages show full course cards
- Added "Clear Conversation" button to start fresh conversations
- Verified conversational flow with end-to-end testing: multi-turn conversations maintain context

**October 28, 2025 - MECE Enhancement & AI Suggestions:**
- Added `handleBroadQuestion()` method to AI service for handling any question type with MECE-focused guidance
- Updated answer service to detect broad questions and generate AI suggestions when direct answers aren't available
- Enhanced schema with `suggestions` and `courseList` fields in `AnswerResponse`
- Updated Home page to display general AI answers with clickable suggestion cards
- Updated example questions to showcase broader capabilities (course details, grading, browse, requirements, general)
- Verified complete test coverage: specific courses, broad queries, suggestions, theme toggle all working

**October 28, 2025 - User-Friendly Grading Display:**
- Created `shared/grading-utils.ts` with `formatGradingBasis()` utility
- Replaced technical codes (GRI, SUI, OPT) with plain language explanations
- Updated AnswerCard and answer service to use human-readable grading format

**October 28, 2025 - Search Bar UX Improvements:**
- Fixed search bar clickability with `pointer-events-none` on gradient overlay
- Minimal red circular search button positioned on left
- Perfect vertical centering of search input
- Updated example questions to better showcase chatbot capabilities

## Production Deployment

- **Development Site**: Running locally with in-memory storage
- **Production Site**: https://cornell-course-chat.replit.app
- **Note**: Production database requires independent ingestion (separate from development)
- User must manually click Deploy/Publish button to update production

## External Dependencies

- **Cornell Class Roster API**: The primary source of course data
- **OpenAI GPT-4o-mini**: Used for generating AI-powered conversational answers and suggestions
- **Express.js**: Backend web framework
- **React**: Frontend JavaScript library for building user interfaces
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Shadcn UI**: UI component library
- **p-queue**: Used for rate limiting API requests to the Cornell API
