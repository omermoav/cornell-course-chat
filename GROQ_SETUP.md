# Free LLM with Groq - Setup Guide

## 🎉 Why Groq?

- ✅ **Completely FREE** - No credit card required!
- ⚡ **Super fast** - Fastest LLM inference in the world
- 🤖 **Great models** - Llama 3.1 70B is excellent
- 🔓 **Generous limits** - 30 requests/minute free tier
- 🔌 **OpenAI-compatible** - Works with existing code

---

## 🚀 Setup Steps (5 minutes)

### Step 1: Get Free Groq API Key

1. Go to https://console.groq.com/
2. Click **"Sign Up"** (use Google or email - it's free!)
3. After signing in, go to **"API Keys"** in the left sidebar
4. Click **"Create API Key"**
5. Give it a name (e.g., "Cornell Course Chat")
6. Click **"Submit"**
7. **Copy the API key** (starts with `gsk_...`)

**Important:** Save your key somewhere safe! You won't be able to see it again.

---

### Step 2: Update Replit Secrets

1. In Replit, go to **Tools** → **Secrets** (🔒 icon)

2. **Update or Create** these secrets:

   **Secret 1:**
   - Key: `AI_INTEGRATIONS_OPENAI_API_KEY`
   - Value: Your Groq API key (the one starting with `gsk_...`)

   **Secret 2:**
   - Key: `AI_INTEGRATIONS_OPENAI_BASE_URL`
   - Value: `https://api.groq.com/openai/v1`

3. **Save** both secrets

---

### Step 3: Deploy the Latest Code

In **Replit Shell**, run:

```bash
git pull origin main
```

---

### Step 4: Restart Server

1. Click **Stop** button in Replit
2. Click **Run** button
3. Wait for server to start

---

### Step 5: Test It! 🎯

Try these queries in your app:

```
✅ "What are the classes offered in 2025?"
✅ "What CS courses are offered?"
✅ "Tell me about Cornell Tech courses"
✅ "What is NBAY 6170?"
✅ "What's the weather?" (should politely reject)
```

---

## ✅ How to Verify It's Working

### Check Console Logs

When you submit a query, you should see:

```
[AIService] Initialized with base URL: https://api.groq.com/openai/v1
[AIService] Understanding query: What are the classes offered in 2025?
[AIService] Understanding result: {...}
[AnswerService] Using AI-extracted subjects: [...]
```

**No errors!** ✅

---

## 🆚 Groq vs OpenAI Comparison

| Feature | Groq (Free) | OpenAI (Paid) |
|---------|-------------|---------------|
| **Cost** | FREE ✅ | ~$0.15 per 1M tokens |
| **Speed** | Very fast ⚡ | Fast |
| **Model** | Llama 3.1 70B | GPT-4o-mini |
| **Quality** | Excellent | Excellent |
| **Rate Limit** | 30 req/min | Higher |
| **Setup** | Sign up, free key | Credit card required |

**For this chatbot:** Groq is perfect! The quality is excellent and it's completely free.

---

## 🔧 Available Groq Models

The code is configured to use `llama-3.3-70b-versatile` which is the latest and best general-purpose model.

Other options (if you want to change):
- `llama-3.3-70b-versatile` - Latest Llama model, best for general tasks ✅ (default)
- `llama-3.1-8b-instant` - Faster, smaller, still good quality
- `mixtral-8x7b-32768` - Good alternative, longer context
- `gemma2-9b-it` - Smaller, faster

To change models, edit line 114, 193, 321 in `server/ai-service.ts`:
```typescript
const model = isGroq ? "llama-3.1-8b-instant" : "gpt-4o-mini";
```

---

## 📊 Free Tier Limits

**Groq Free Tier:**
- **30 requests per minute**
- **6,000 tokens per minute**
- **14,400 requests per day**

**More than enough for a course chatbot!** 🎉

If you need more:
- Groq has paid tiers with higher limits
- But free tier should be plenty for testing/personal use

---

## 🎯 What Now Works (With Free AI!)

Your chatbot now:
- ✅ Understands **any natural language input**
- ✅ Intelligently **extracts subjects and intents**
- ✅ **Gracefully rejects** off-topic questions
- ✅ Maintains **conversation context**
- ✅ Provides **helpful suggestions**
- ✅ Works **completely FREE** with Groq!

---

## 🔍 Troubleshooting

### Error: "Invalid API key"

**Solution:**
- Check API key in Replit Secrets (should start with `gsk_`)
- Make sure you copied the full key
- Try creating a new key in Groq Console

### Error: "Rate limit exceeded"

**Solution:**
- Groq free tier: 30 requests/minute
- Wait a minute and try again
- For production, consider Groq's paid tier

### Still seeing "insufficient_quota" error

**Solution:**
- Make sure `AI_INTEGRATIONS_OPENAI_BASE_URL` is set to Groq's URL
- Restart server after updating secrets
- Check Console logs to verify it's using Groq

### Not using Groq (still trying OpenAI)

**Solution:**
- Verify `AI_INTEGRATIONS_OPENAI_BASE_URL` = `https://api.groq.com/openai/v1`
- Server needs restart after updating secrets
- Check Console log: should say "Initialized with base URL: https://api.groq.com..."

---

## 🎓 Learn More

- **Groq Console:** https://console.groq.com/
- **Groq Docs:** https://console.groq.com/docs/quickstart
- **Groq Models:** https://console.groq.com/docs/models
- **Rate Limits:** https://console.groq.com/docs/rate-limits

---

## 🎉 Success!

Once you see this in the Console:
```
[AIService] Initialized with base URL: https://api.groq.com/openai/v1
[AIService] Understanding query: ...
[AIService] Understanding result: ...
```

**You're all set!** Your chatbot now uses free, fast AI from Groq! 🚀

No more OpenAI quota errors. No credit card needed. Just intelligent, natural language understanding for your Cornell course chatbot!

Enjoy! 🎓

