# Debugging Guide: AI-First System Not Working

## 🔍 Problem: Still Getting "No courses found for subject THE"

This error means the AI query understanding is failing and the system is falling back to the old regex pattern matcher, which incorrectly extracts "THE" as a subject code.

---

## ✅ Solution Steps

### Step 1: Check OpenAI API Key in Replit

**Most common issue:** The OpenAI API key is not set correctly in Replit Secrets.

1. In Replit, click **Tools** → **Secrets** (or the 🔒 lock icon in sidebar)
2. Verify these secrets exist:
   - `AI_INTEGRATIONS_OPENAI_API_KEY` = your actual OpenAI key
   - `AI_INTEGRATIONS_OPENAI_BASE_URL` = `https://api.openai.com/v1`

3. **If missing or wrong:**
   - Delete the old secret
   - Add new secret with exact name (copy-paste to avoid typos)
   - Restart server

**Common mistakes:**
- ❌ `OPENAI_API_KEY` (wrong name)
- ❌ `AI_INTEGRATIONS_OPENAI_KEY` (missing _API_)
- ✅ `AI_INTEGRATIONS_OPENAI_API_KEY` (correct!)

### Step 2: Check the Console Logs

1. In Replit, open the **Console** tab
2. Try a query: "What classes are offered in Fall 2025?"
3. Look for these log messages:

**If Working Correctly:**
```
[AIService] Understanding query: What classes are offered in Fall 2025?
[AIService] Understanding result: {
  "isRelevant": true,
  "extractedInfo": {
    "subjects": ["CS", "INFO", "NBAY", "TECH"],
    "queryType": "subject_courses",
    "year": "2025",
    "term": "fall"
  }
}
[AnswerService] Using AI-extracted subjects: ["CS"]
```

**If OpenAI API Key is Missing:**
```
[AIService] Query understanding error: Error: No API key provided
[AnswerService] Falling back to traditional parser
```

**If OpenAI API is Down:**
```
[AIService] Query understanding error: FetchError: request to https://api.openai.com/v1/chat/completions failed
[AnswerService] Falling back to traditional parser
```

**If Rate Limited:**
```
[AIService] Query understanding error: 429 Too Many Requests
```

### Step 3: Verify Code Was Updated

In Replit Shell, run:

```bash
grep -n "understandQuery" server/answer-service.ts
```

**Should see:**
```
89:    const understanding = await aiService.understandQuery(query, conversationHistory);
```

If not found, the code wasn't updated. Pull again:

```bash
git pull origin main
```

### Step 4: Test OpenAI API Key

In Replit Shell, test the API key directly:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $AI_INTEGRATIONS_OPENAI_API_KEY"
```

**If working:** You'll see a JSON list of models

**If failing:** You'll see an error like `"invalid_api_key"`

---

## 🎯 Quick Fixes Based on Error

### Error: "No courses found for subject THE/WHAT/IN"

**Cause:** AI understanding is failing, regex extracts wrong subject

**Fix:**
1. Check OpenAI API key in Secrets
2. Verify key has credits (check OpenAI dashboard)
3. Check Console logs for specific error

### Error: "No API key provided"

**Cause:** API key not set or named incorrectly

**Fix:**
1. Go to Replit Secrets
2. Add `AI_INTEGRATIONS_OPENAI_API_KEY` = your key
3. Make sure it's the EXACT name
4. Restart server

### Error: "429 Too Many Requests"

**Cause:** Hit OpenAI rate limit

**Fix:**
1. Wait a minute
2. Check OpenAI dashboard for rate limits
3. Upgrade OpenAI plan if needed

### Error: "Model not found: gpt-4o-mini"

**Cause:** Your OpenAI account doesn't have access to gpt-4o-mini

**Fix:** Change model in `server/ai-service.ts`:
```typescript
model: "gpt-3.5-turbo",  // Instead of "gpt-4o-mini"
```

---

## 🔧 Manual Test of AI Understanding

Add this test endpoint temporarily to `server/routes.ts`:

```typescript
// After the /api/ask endpoint, add:
app.post("/api/test/understand", async (req, res) => {
  try {
    const { question } = req.body;
    const { aiService } = await import("./ai-service");
    const understanding = await aiService.understandQuery(question);
    res.json({ success: true, understanding });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
```

Then test it:

```bash
curl -X POST http://localhost:5000/api/test/understand \
  -H "Content-Type: application/json" \
  -d '{"question": "What classes are offered in Fall 2025?"}'
```

**If working:** You'll see extracted subjects

**If failing:** You'll see the error message

---

## 📋 Verification Checklist

Work through this checklist:

- [ ] Replit Secrets has `AI_INTEGRATIONS_OPENAI_API_KEY`
- [ ] Replit Secrets has `AI_INTEGRATIONS_OPENAI_BASE_URL`
- [ ] API key is valid (test with curl)
- [ ] API key has credits (check OpenAI dashboard)
- [ ] Code was updated (grep shows understandQuery call)
- [ ] Server was restarted after pull
- [ ] Console shows AI log messages
- [ ] No errors in Console about OpenAI

---

## 🚀 Step-by-Step: Complete Reset

If nothing works, do a complete reset:

### 1. Stop the Server
Click **Stop** button in Replit

### 2. Pull Latest Code
```bash
git fetch origin
git reset --hard origin/main
```

### 3. Verify Secrets
- Delete all OpenAI-related secrets
- Add fresh:
  - `AI_INTEGRATIONS_OPENAI_API_KEY` = (your key from OpenAI dashboard)
  - `AI_INTEGRATIONS_OPENAI_BASE_URL` = `https://api.openai.com/v1`

### 4. Clear Node Modules (if needed)
```bash
rm -rf node_modules
npm install
```

### 5. Start Server
Click **Run** button

### 6. Watch Console
Look for the log messages when you test a query

### 7. Test Query
Try: "What classes are offered in Fall 2025?"

---

## 📞 Still Not Working?

If you've tried everything above and it's still not working:

### Check OpenAI Account Status

1. Go to https://platform.openai.com/account/api-keys
2. Verify your API key exists and is active
3. Check https://platform.openai.com/usage
4. Make sure you have credits/billing set up

### Try with gpt-3.5-turbo

If gpt-4o-mini isn't available for your account:

In `server/ai-service.ts`, change line 105:
```typescript
model: "gpt-3.5-turbo",  // Change from "gpt-4o-mini"
```

### Enable More Detailed Logging

In `server/ai-service.ts`, add this after line 104:

```typescript
console.log('[AIService] Calling OpenAI with:', {
  model: 'gpt-4o-mini',
  messages: messages.length,
  hasApiKey: !!this.openai.apiKey
});
```

---

## 💡 What Should Happen

### When Everything Works:

1. **User asks:** "What classes are offered in Fall 2025?"

2. **Console shows:**
```
[AIService] Understanding query: What classes are offered in Fall 2025?
[AIService] Understanding result: {...extracted info...}
[AnswerService] AI Understanding: {...}
[AnswerService] Using AI-extracted subjects: [...]
```

3. **User sees:** List of courses with helpful AI response about term availability

### When OpenAI Fails:

1. **User asks:** "What classes are offered in Fall 2025?"

2. **Console shows:**
```
[AIService] Query understanding error: [specific error]
[AnswerService] Falling back to traditional parser
```

3. **User sees:** Error like "No courses found for subject THE"

---

## 🎯 The Root Cause

The error "No courses found for subject THE" happens because:

1. AI understanding **tries to call OpenAI**
2. OpenAI call **fails** (no key, invalid key, network error, etc.)
3. System **catches error** and returns fallback response
4. Code **falls back to regex pattern matching**
5. Regex **incorrectly extracts "THE"** from "the classes"
6. System **tries to find subject "THE"**
7. Error: **"No courses found for subject THE"**

**Fix:** Make sure OpenAI API calls succeed!

---

## ✅ Success Indicators

You'll know it's working when:

- ✅ Console shows "[AIService] Understanding query"
- ✅ Console shows extracted subjects from AI
- ✅ NO "Falling back to traditional parser" message
- ✅ Query "What classes are offered in Fall 2025?" works
- ✅ NO errors about "subject THE/WHAT/IN"

---

## 📚 Additional Resources

- OpenAI API Keys: https://platform.openai.com/api-keys
- OpenAI Usage: https://platform.openai.com/usage
- OpenAI Status: https://status.openai.com
- Replit Secrets Docs: https://docs.replit.com/programming-ide/workspace-features/secrets

Good luck! The AI system will work great once the API key is configured correctly. 🎉

