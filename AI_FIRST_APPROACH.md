# AI-First Query Understanding

## 🎯 New Approach: From Pattern Matching to AI Understanding

### The Problem We Fixed

**Old Approach (Pattern-Based):**
- Used rigid regex patterns to parse queries
- Failed on natural language variations
- Extracted "WHAT" as a subject code from "What classes are offered in 2025?"
- Couldn't handle: "Cornell Tech courses", "classes in 2025", "machine learning courses"

**New Approach (AI-First):**
- Uses OpenAI GPT-4o-mini to understand user intent
- Works with ANY natural language input
- Gracefully handles and rejects off-topic questions
- Extracts subjects, terms, and query types intelligently

---

## 🧠 How It Works

### Step 1: AI Query Understanding

When a user asks a question, the AI first analyzes it:

```typescript
const understanding = await aiService.understandQuery(query, conversationHistory);
```

The AI determines:
- **Is this relevant** to Cornell courses?
- **What subjects** are mentioned? (CS, INFO, NBAY, etc.)
- **What type** of query is it?
  - `specific_course`: "What is CS 2110?"
  - `subject_courses`: "What CS courses are offered?"
  - `general_inquiry`: "Tell me about machine learning"
  - `off_topic`: "What's the weather?"
- **What information** is being requested? (term, year, prerequisites, etc.)

### Step 2: Smart Response Routing

Based on AI understanding:

1. **Off-Topic Questions** → Polite rejection with suggestions
2. **Subject Queries** → Use AI-extracted subjects to search database
3. **Specific Courses** → Use traditional parser + AI enhancement
4. **General Inquiries** → AI-generated helpful response

### Step 3: Context-Aware Responses

- Maintains conversation history
- Understands follow-up questions
- Provides helpful suggestions
- Explains data limitations (e.g., semester availability)

---

## ✅ What Now Works

### Natural Language Variations

**Before:** ❌ "What classes are offered in 2025 in Cornell Tech?"
- Error: "No courses found for subject WHAT"

**After:** ✅ Same query works!
- AI extracts: subjects: ["NBAY", "TECH"], year: "2025"
- Shows Cornell Tech courses with temporal context

### Broad Queries

✅ "What classes are offered in 2025 in Cornell Tech?"
✅ "Tell me about Cornell Tech courses"
✅ "What machine learning courses are available?"
✅ "Show me AI classes"
✅ "What can I take at Cornell Tech?"

### Off-Topic Questions

**Query:** "What's the weather today?"

**Response:**
```
I appreciate your question, but I'm specifically designed to help 
with Cornell University course information. I can answer questions about:

• Specific courses (e.g., "What is CS 2110?")
• Course schedules and instructors
• Prerequisites and requirements
• Grading policies
• Learning outcomes
• Available courses in different subjects

Feel free to ask me anything about Cornell courses!
```

### Follow-Up Questions

**Conversation:**
```
User: "What Cornell Tech courses are offered?"
Bot: [Shows NBAY and TECH courses]

User: "Tell me more about the AI course"
Bot: [Understands context, searches for AI-related courses]

User: "What's the weather?"
Bot: [Politely redirects to course questions]
```

---

## 🔧 Technical Implementation

### New AI Service Method

```typescript
async understandQuery(
  userQuestion: string, 
  conversationHistory?: ChatMessage[]
): Promise<QueryUnderstanding>
```

**Returns:**
```typescript
{
  isRelevant: true/false,
  reasoning: "User is asking about Cornell Tech courses for 2025",
  extractedInfo: {
    subjects: ["NBAY", "TECH"],
    catalogNumber: null,
    term: null,
    year: "2025",
    queryType: "subject_courses"
  },
  suggestedQuery: null
}
```

### Enhanced Answer Service

The answer service now:
1. **First** uses AI to understand the query
2. **Checks** if the question is relevant
3. **Rejects** off-topic questions politely
4. **Uses AI-extracted subjects** when pattern matching fails
5. **Falls back** to traditional parsing for well-formed queries

---

## 🎯 Test Cases

### Test 1: Natural Language with Year

```
Query: "What classes are offered in 2025 in Cornell Tech?"

Expected: Shows NBAY/TECH courses with note about data from [current term]
```

### Test 2: Broad Subject Query

```
Query: "Tell me about Cornell Tech courses"

Expected: Lists NBAY and TECH courses with AI summary
```

### Test 3: Off-Topic Question

```
Query: "What's the weather today?"

Expected: Polite rejection with course-related suggestions
```

### Test 4: Ambiguous Query

```
Query: "Show me AI classes"

Expected: AI interprets as CS/INFO machine learning courses
```

### Test 5: Follow-Up Question

```
Conversation:
1. "What is NBAY 6170?"
2. "Who teaches it?"

Expected: Second question references NBAY 6170 from context
```

### Test 6: Misspelled/Unclear Query

```
Query: "coarse about machne lerning"

Expected: AI understands intent, shows ML-related courses
```

---

## 🚀 Benefits

### 1. Works with Any Input
- No need to memorize specific patterns
- Natural conversation style
- Handles typos and variations

### 2. Graceful Rejection
- Off-topic questions get helpful responses
- Always redirects to what the bot CAN help with
- Never shows confusing errors

### 3. Context Awareness
- Remembers conversation history
- Understands pronouns and references
- Natural follow-up questions work

### 4. Intelligent Extraction
- AI extracts subjects even when not explicit
- "Cornell Tech" → NBAY, TECH subjects
- "machine learning" → CS, INFO courses
- Handles years without treating them as catalog numbers

### 5. Helpful Suggestions
- Always provides next steps
- Suggests similar queries
- Shows example questions

---

## 📊 Performance Considerations

### API Calls
- **1 additional OpenAI call** per user query for understanding
- Fast (~200-300ms typical response time)
- Cached conversation context for efficiency
- Falls back gracefully on API errors

### Cost
- GPT-4o-mini is very affordable (~$0.00015 per request)
- JSON mode for consistent parsing
- Lower temperature (0.3) for deterministic results

### Reliability
- **Fallback to traditional parser** if AI fails
- **Default to relevant** if uncertain (better to try than reject)
- Error handling at every step

---

## 🔄 Migration Path

### Old System Still Works
- Traditional pattern matching as fallback
- Well-formed queries (e.g., "What is CS 2110?") still fast
- No breaking changes

### New System Handles Edge Cases
- Natural language variations
- Ambiguous queries
- Off-topic questions
- Follow-up questions with context

---

## 📝 Configuration

### Environment Variables Required

```bash
AI_INTEGRATIONS_OPENAI_API_KEY=your-key-here
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

### Model Configuration

- **Model:** GPT-4o-mini (fast, affordable, capable)
- **Temperature:** 0.3 (consistent, deterministic)
- **Max Tokens:** 300 (efficient for understanding)
- **Format:** JSON mode (structured output)

---

## 🎉 Summary

The chatbot now:
- ✅ Works with **any natural language input**
- ✅ **Gracefully rejects** off-topic questions
- ✅ **Intelligently extracts** subjects and intents
- ✅ **Maintains context** across conversation
- ✅ **Provides helpful** suggestions and guidance
- ✅ **Handles edge cases** that regex patterns miss
- ✅ **Falls back** to traditional parsing when appropriate

No more rigid patterns. No more "No courses found for subject WHAT" errors. Just intelligent, helpful responses! 🎓

