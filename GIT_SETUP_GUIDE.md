# Git Setup Guide: Local ↔️ Replit Sync

## 🎯 Goal
Set up Git to sync your code between your local machine and Replit, with GitHub as the central hub.

---

## 📋 Prerequisites

- [x] Git installed locally (already have it!)
- [ ] GitHub account (create at https://github.com if needed)
- [ ] Replit account with your project

---

## 🚀 Setup Process

### Part 1: Create GitHub Repository (5 minutes)

#### Step 1.1: Create New Repo on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `cornell-course-chat` (or your preferred name)
   - **Description**: "Cornell Classes Q&A Chatbot with AI-powered responses"
   - **Visibility**: Choose Public or Private
   - **⚠️ Important**: Do NOT check "Initialize with README" (we have existing code)
3. Click **"Create repository"**

#### Step 1.2: Copy the Repository URL

After creation, GitHub will show you a URL like:
```
https://github.com/YOUR-USERNAME/cornell-course-chat.git
```
**Keep this URL handy!** You'll need it in the next steps.

---

### Part 2: Connect Local Project to GitHub (3 minutes)

Open your terminal and run these commands:

```bash
cd /Users/omermoav/Desktop/CornellCourseChat

# Add GitHub as remote (replace with YOUR repository URL)
git remote add origin https://github.com/YOUR-USERNAME/cornell-course-chat.git

# Verify it was added
git remote -v
```

You should see:
```
origin  https://github.com/YOUR-USERNAME/cornell-course-chat.git (fetch)
origin  https://github.com/YOUR-USERNAME/cornell-course-chat.git (push)
```

#### Step 2.2: Commit and Push Your Improvements

```bash
# Stage the improved files
git add server/intent-parser.ts
git add server/answer-service.ts
git add server/ai-service.ts
git add .gitignore

# Stage the documentation
git add QUICKSTART.md
git add TESTING_GUIDE.md

# Commit with descriptive message
git commit -m "Fix: Improve temporal query parsing to handle semester/year queries correctly

- Add isTemporalQuery() to detect questions about specific terms
- Prevent years (2025, 2024) from being parsed as course catalog numbers
- Extract subject code correctly for queries like 'CS classes for fall 2025'
- Add helpful context about available term data
- Update AI prompts to handle temporal queries better"

# Push to GitHub
git push -u origin main
```

**Authentication**: GitHub will prompt for credentials. You may need to:
- Use a **Personal Access Token** instead of password (GitHub requires this now)
- Create one at: https://github.com/settings/tokens
- Or set up SSH keys: https://docs.github.com/en/authentication

---

### Part 3: Connect Replit to GitHub (5 minutes)

#### Step 3.1: Open Your Replit Project

1. Go to https://replit.com
2. Open your Cornell Course Chat project

#### Step 3.2: Connect to GitHub via Replit

**Option A: Using Replit's Git Interface (Easier)**

1. In Replit, look for the **Version Control** panel (or **Git** icon in left sidebar)
2. Click **"Connect to GitHub"** or **"Import from GitHub"**
3. Authorize Replit to access your GitHub account
4. Select your repository: `YOUR-USERNAME/cornell-course-chat`
5. Replit will pull the latest code from GitHub

**Option B: Using Replit Shell (Alternative)**

1. Open the **Shell** tab in Replit
2. Run these commands:

```bash
# Remove any existing git config (if needed)
rm -rf .git

# Clone from GitHub
git clone https://github.com/YOUR-USERNAME/cornell-course-chat.git temp
mv temp/.git .
rm -rf temp

# Pull the latest changes
git pull origin main
```

#### Step 3.3: Set Up Environment Variables in Replit

⚠️ **Important**: Your `.env` file won't sync (it's in `.gitignore` for security).

In Replit:
1. Go to **Tools** → **Secrets** (or the 🔒 icon)
2. Add these secrets:
   - `AI_INTEGRATIONS_OPENAI_API_KEY` = your OpenAI key
   - `AI_INTEGRATIONS_OPENAI_BASE_URL` = `https://api.openai.com/v1`
   - `DATABASE_URL` = your database connection string
   - `PORT` = `5000`

---

## 🔄 Daily Workflow: Syncing Changes

### Scenario 1: Working Locally → Push to Replit

```bash
# 1. Make changes locally (edit files)
# 2. Commit changes
git add .
git commit -m "Description of your changes"

# 3. Push to GitHub
git push origin main

# 4. In Replit Shell, pull the changes
git pull origin main
```

Replit will auto-restart after pulling changes.

---

### Scenario 2: Working in Replit → Pull to Local

```bash
# In Replit Shell:
git add .
git commit -m "Changes made in Replit"
git push origin main

# On your local machine:
cd /Users/omermoav/Desktop/CornellCourseChat
git pull origin main
```

---

## 🎯 Quick Reference Commands

### Check Status
```bash
git status                    # See what's changed
git log --oneline -5         # See last 5 commits
```

### Syncing
```bash
git pull origin main         # Get latest from GitHub
git push origin main         # Send your changes to GitHub
```

### Common Operations
```bash
git add filename.ts          # Stage specific file
git add .                    # Stage all changes
git commit -m "message"      # Commit with message
git diff                     # See what changed
```

### Undo Changes
```bash
git restore filename.ts      # Discard local changes
git reset HEAD~1             # Undo last commit (keep changes)
```

---

## ✅ Verify Setup is Working

### Test 1: Local → GitHub → Replit

1. **Local**: Create a test file
   ```bash
   echo "# Test sync" > TEST_SYNC.md
   git add TEST_SYNC.md
   git commit -m "Test: Verify sync working"
   git push origin main
   ```

2. **GitHub**: Visit your repo, verify `TEST_SYNC.md` appears

3. **Replit Shell**:
   ```bash
   git pull origin main
   ls -la TEST_SYNC.md
   ```
   Should see the file!

4. **Clean up**:
   ```bash
   git rm TEST_SYNC.md
   git commit -m "Remove test file"
   git push origin main
   ```

---

## 🛟 Troubleshooting

### "Permission denied" when pushing
→ You need a GitHub Personal Access Token
→ Create at: https://github.com/settings/tokens
→ Select "repo" scope, then use token as password

### "Conflict" when pulling
→ Someone (you in Replit) changed same lines as local
→ Solution:
```bash
git stash                    # Save local changes
git pull origin main         # Pull remote changes
git stash pop               # Reapply local changes
# Resolve conflicts manually, then commit
```

### Replit won't pull changes
→ Make sure you're in the Shell tab (not Console)
→ Try: `git fetch origin && git reset --hard origin/main`
→ ⚠️ Warning: This discards any uncommitted Replit changes

### Want to sync from scratch
```bash
# In Replit Shell:
git fetch origin
git reset --hard origin/main
```

---

## 🎓 Best Practices

### ✅ DO:
- Commit often with clear messages
- Pull before starting new work
- Push at the end of each work session
- Use branches for experimental features
- Keep `.env` files local (never commit secrets!)

### ❌ DON'T:
- Commit sensitive data (API keys, passwords)
- Force push (`git push -f`) unless you know what you're doing
- Work on both local and Replit simultaneously without syncing
- Commit `node_modules` or `dist` folders

---

## 🎉 You're All Set!

Your workflow is now:
1. **Make changes** (local or Replit)
2. **Commit** to Git
3. **Push** to GitHub
4. **Pull** on the other side
5. **Test** and deploy!

### Current Improvements Ready to Push:
- ✅ Fixed temporal query parsing
- ✅ Added test documentation
- ✅ Updated gitignore for security

Run the commands in Part 2, Step 2.2 to push these improvements to GitHub!

---

## 📚 Additional Resources

- GitHub Docs: https://docs.github.com/en/get-started
- Replit Git Guide: https://docs.replit.com/tutorials/replit/using-git-on-replit
- Git Cheat Sheet: https://education.github.com/git-cheat-sheet-education.pdf

