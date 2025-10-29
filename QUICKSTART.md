# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create `.env` File
Create a file named `.env` in the project root with:
```bash
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL=postgresql://user:password@host/database
PORT=5000
```

**Get your credentials:**
- OpenAI API Key: https://platform.openai.com/api-keys
- Free PostgreSQL DB: https://neon.tech

### 3. Initialize Database
```bash
npm run db:push
```

### 4. Start the Server
```bash
npm run dev
```

### 5. Open in Browser
Navigate to: **http://localhost:5000**

### 6. Load Course Data (First Time Only)

In a new terminal, run:
```bash
# Quick option - Cornell Tech courses only (~5 mins)
curl -X POST http://localhost:5000/api/admin/ingest/cornell-tech

# OR Full option - All Cornell courses (~60 mins)
curl -X POST http://localhost:5000/api/admin/ingest
```

---

## Test the Improvements

Try these queries to test the temporal query fix:

### ✅ Now Working Correctly:
```
"What are the CS classes for fall 2025?"
"Which INFO courses are offered in spring 2024?"
"What CS courses are available?"
```

### ✅ Other Query Types:
```
"What is NBAY 6170?"
"Is CS 4780 pass/fail?"
"Tell me about machine learning courses"
"Prerequisites for ORIE 3500?"
```

---

## What Was Fixed

**Problem**: "What are the CS classes for fall 2025?" returned error:
```
"No roster history found for CS 2025."
```

**Solution**: The intent parser now:
- Detects temporal queries (fall, spring, 2025, etc.)
- Doesn't treat years as course catalog numbers
- Extracts only the subject code (CS) correctly
- Provides helpful context about available data

---

## Key Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:push          # Create/update database schema

# Production
npm run build            # Build for production
npm start                # Run production server

# Type Checking
npm run check            # Run TypeScript type checker
```

---

## Troubleshooting

**No courses found?**
→ Run the ingestion endpoint to load data

**AI not responding?**
→ Check your OpenAI API key in `.env`

**Database errors?**
→ Verify DATABASE_URL is correct and accessible

**Port already in use?**
→ Change PORT in `.env` to a different number (e.g., 3000)

---

## Next Steps

1. ✅ Test the temporal query fix with "What are the CS classes for fall 2025?"
2. ✅ Try different question types
3. ✅ Test the conversation feature with follow-up questions
4. ✅ Toggle between light/dark themes
5. ✅ Check the full TESTING_GUIDE.md for comprehensive test cases

Enjoy your improved Cornell Course Chat! 🎓

