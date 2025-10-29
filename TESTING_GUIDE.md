# Testing Guide - Cornell Course Chat

## How to Run and Test the Application

### Prerequisites

1. **Node.js**: Version 18+ installed
2. **OpenAI API Access**: For AI-powered responses
3. **PostgreSQL Database**: Via Neon or other provider

### Step 1: Set Up Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# OpenAI Configuration (required for AI responses)
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=your-openai-api-key-here

# Database Configuration (required for persistent storage)
DATABASE_URL=postgresql://user:password@host/database

# Optional: Server Port (defaults to 5000)
PORT=5000
```

**Note**: If you don't have these credentials yet:
- **OpenAI API Key**: Get one from https://platform.openai.com/api-keys
- **Database**: Sign up for free at https://neon.tech or use any PostgreSQL provider

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Initialize Database Schema

Run the database migration to create the required tables:

```bash
npm run db:push
```

This creates three tables: `rosters`, `subjects`, and `courses`.

### Step 4: Start the Development Server

```bash
npm run dev
```

The server will start on http://localhost:5000 (or your configured PORT).

---

## Testing the Improvements

### Test Case 1: Temporal Queries (THE MAIN FIX)

**What was fixed**: Questions about specific semesters/terms now work correctly.

**Before the fix**:
- Query: "What are the CS classes for fall 2025?"
- Result: ❌ Error: "No roster history found for CS 2025"

**After the fix**:
- Query: "What are the CS classes for fall 2025?"
- Result: ✅ Shows CS courses with a note about available data

**Try these queries:**
```
1. "What are the CS classes for fall 2025?"
2. "Which INFO courses are offered in spring 2024?"
3. "What CS courses are available this semester?"
```

**Expected behavior**: 
- Should extract subject code (CS, INFO) correctly
- Should NOT treat years (2025, 2024) as course catalog numbers
- Should provide helpful context about which term the data is from

---

### Test Case 2: Subject-Only Queries

**Try these queries:**
```
1. "What CS courses are offered?"
2. "Tell me about INFO courses"
3. "What NBAY courses are available?"
```

**Expected behavior**:
- Lists courses from that subject
- Provides AI-generated summary
- Shows sample courses with catalog numbers and titles

---

### Test Case 3: Specific Course Queries

**Try these queries:**
```
1. "What is NBAY 6170?"
2. "Is CS 4780 pass/fail?"
3. "Prerequisites for ORIE 3500?"
4. "Who teaches CS 2110?"
```

**Expected behavior**:
- Shows full course details
- AI answer addresses specific question
- Displays comprehensive course information card

---

### Test Case 4: Topic-Based Queries

**Try these queries:**
```
1. "Tell me about machine learning courses"
2. "What database courses are available?"
3. "Are there any AI courses?"
```

**Expected behavior**:
- AI provides helpful response
- Suggests specific courses to explore
- Clickable suggestion buttons

---

### Test Case 5: Conversation Context

**Try this conversation flow:**
```
User: "What is NBAY 6170?"
Bot: [Shows course details]

User: "Who teaches it?"
Bot: [Should reference NBAY 6170 from context]

User: "What are the prerequisites?"
Bot: [Should still reference NBAY 6170]
```

**Expected behavior**:
- Follow-up questions understand context
- No need to repeat course code
- Natural conversational flow

---

## Initial Data Setup

Before testing course-specific queries, you need to ingest data from the Cornell API:

### Option 1: Quick Start - Cornell Tech Priority Ingestion (Faster)

Ingest only Cornell Tech and related courses (NBAY, TECH, INFO, CS):

```bash
curl -X POST http://localhost:5000/api/admin/ingest/cornell-tech
```

This takes ~5-10 minutes and gives you enough data to test with.

### Option 2: Full Ingestion (Comprehensive but Slower)

Ingest all Cornell courses from all available semesters:

```bash
curl -X POST http://localhost:5000/api/admin/ingest
```

⚠️ **Warning**: This can take 30-60 minutes due to API rate limits (1 request/second).

### Check Ingestion Progress

```bash
curl http://localhost:5000/api/admin/ingest/progress
```

---

## Testing the UI

### Manual Testing Checklist

1. **Open the app**: Navigate to http://localhost:5000
2. **Test search input**:
   - ✅ Input field is clickable
   - ✅ Red circular search button on left
   - ✅ Animated focus effects work
3. **Test example questions**:
   - ✅ Click each example question button
   - ✅ Verify it populates the search field
4. **Test queries**:
   - ✅ Try all test cases listed above
   - ✅ Verify temporal queries work correctly
5. **Test conversation**:
   - ✅ Ask follow-up questions
   - ✅ Verify context is maintained
   - ✅ Click "Clear Conversation" button
6. **Test recent searches**:
   - ✅ Recent queries appear after searching
   - ✅ Click a recent query to re-run it
   - ✅ Clear recent searches
7. **Test theme toggle**:
   - ✅ Switch between light/dark mode
   - ✅ Verify colors update correctly
8. **Test scroll behavior**:
   - ✅ Have a long conversation
   - ✅ Verify search input stays at bottom
   - ✅ Auto-scroll to new messages works

---

## API Testing with curl

### Check Server Health
```bash
curl http://localhost:5000/api/ping
```

### Ask a Question
```bash
curl -X POST http://localhost:5000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the CS classes for fall 2025?"}'
```

### Get Available Rosters
```bash
curl http://localhost:5000/api/rosters
```

### Get Latest Course Offering
```bash
curl "http://localhost:5000/api/classes/latest?subject=CS&catalog_nbr=2110"
```

---

## Debugging Tips

### If AI responses aren't working:
1. Check your OpenAI API key is correct in `.env`
2. Verify you have credits available in your OpenAI account
3. Check server logs for API errors

### If no courses are found:
1. Make sure ingestion has completed
2. Check ingestion progress endpoint
3. Verify database connection is working

### If temporal queries still fail:
1. Check the server logs for parsing errors
2. Verify the intent parser is correctly identifying the query type
3. Test with simpler queries first (e.g., "What CS courses are offered?")

### View Server Logs:
The development server shows detailed logs including:
- API requests and responses
- Parsed question intents
- AI service calls
- Database queries

---

## Production Deployment

For production deployment on Replit:
1. Set environment variables in Replit Secrets
2. Click Deploy/Publish button
3. Run ingestion on production database separately
4. Production URL: https://cornell-course-chat.replit.app

---

## Summary of What Was Fixed

The main issue was that the intent parser treated years (2025, 2024, etc.) as course catalog numbers. For example:
- "What are the CS classes for fall 2025?" was parsed as course "CS 2025"
- This caused a "No roster history found" error

**The fix**:
1. Added temporal query detection (fall, spring, summer, winter, years)
2. Skip years starting with "202" when extracting catalog numbers
3. Extract only subject code when it's a temporal query
4. Provide helpful context about which term the data is from
5. Guide users to classes.cornell.edu for term-specific information

Now the chatbot correctly understands these question patterns and provides helpful responses even when asking about terms not in the database!

