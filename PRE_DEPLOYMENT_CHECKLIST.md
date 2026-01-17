# Pre-Deployment Checklist

Complete this checklist before pushing to GitHub and deploying to production.

## ✅ Completed (Already Done)

### Code Implementation
- [x] Database migration script created (`scripts/003-add-email-columns.sql`)
- [x] Email parser implemented (`lib/email/parser.ts`)
- [x] Gmail API client created (`lib/gmail/client.ts`)
- [x] Keyword matcher built (`lib/email/matcher.ts`)
- [x] Email notification system (`lib/mailer/`)
- [x] Query processor service (`lib/services/query-processor.ts`)
- [x] Cron endpoints created (`app/api/cron/`)
- [x] OAuth authentication scripts (`scripts/gmail-auth.ts`)
- [x] Test scripts (`scripts/test-gmail.ts`, `scripts/test-parser.ts`)

### Configuration
- [x] `.env.local` configured with all required credentials
- [x] Gmail OAuth successfully completed (refresh token obtained)
- [x] Gmail App Password generated
- [x] Database migration executed in Supabase
- [x] `.gitignore` properly configured to exclude secrets
- [x] `.env.example` created with placeholders

### Documentation
- [x] README.md - Main project documentation
- [x] DEPLOYMENT.md - Complete deployment guide
- [x] SECURITY.md - Security best practices
- [x] CONTRIBUTING.md - Contribution guidelines
- [x] CRON-JOB-ORG-SETUP.md - Cron configuration guide
- [x] LICENSE - MIT License

## 🔒 Security Verification (CRITICAL - Do This Before Pushing)

### 1. Verify No Secrets in Git

```bash
# Run these commands to check for accidentally committed secrets
cd /Users/savage/HAROFilter/harofilter

# Check .gitignore is working
git status

# Should NOT show any of these files:
# - .env.local
# - .env.production
# - .env

# Verify .gitignore contains .env protection
grep -E "\.env" .gitignore

# Should show: .env*

# Check git history for any accidentally committed secrets
git log --all --full-history --source -- .env.local .env.production .env

# Should show: (empty output - no history)
```

**If secrets found in git history:**
1. DO NOT push to GitHub yet
2. Use `git-filter-repo` to remove them: https://github.com/newren/git-filter-repo
3. Re-verify after cleaning

### 2. Review .env.local One More Time

Open `.env.local` and verify these credentials are REAL and WORKING:

```bash
# View current .env.local (to verify it's correct)
cat .env.local
```

**Checklist:**
- [ ] NEXT_PUBLIC_SUPABASE_URL is correct
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
- [ ] GOOGLE_CLIENT_ID matches Google Cloud Console
- [ ] GOOGLE_CLIENT_SECRET matches Google Cloud Console
- [ ] GOOGLE_REDIRECT_URL is `http://localhost:3000/api/gmail/auth` for local
- [ ] GMAIL_REFRESH_TOKEN is the one from successful OAuth
- [ ] GMAIL_USER is `untttld@gmail.com`
- [ ] GMAIL_APP_PASSWORD is correct (no spaces after removing them)
- [ ] CRON_SECRET is strong random string
- [ ] NEXT_PUBLIC_APP_URL is `http://localhost:3000` for local

### 3. Remove Sensitive Information from Code

Search for any hardcoded credentials or sensitive data:

```bash
# Search for common credential patterns
grep -r "supabase.co" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .
grep -r "apps.googleusercontent.com" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .
grep -r "@gmail.com" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .

# These should only appear in:
# - .env.local (excluded from git)
# - .env.example (with placeholders)
# - Documentation files (with generic examples)
```

**If found in code files:**
1. Replace with environment variable references
2. Commit the fix
3. Re-verify

## 🧪 Local Testing (Do This Before Deploying)

### 1. Test Development Server

```bash
npm run dev
```

**Test these flows:**
- [ ] Can access http://localhost:3000
- [ ] Can sign up with new account
- [ ] Can log in
- [ ] Can add keywords in settings
- [ ] Can view dashboard

### 2. Test Gmail API Connection

```bash
npm run test-gmail
```

**Expected output:**
```
✅ Environment variables found
✅ Gmail client initialized
✅ Credentials verified
✅ Found X unread HARO email(s)
✅ All tests passed!
```

- [ ] Test passes with no errors

### 3. Test Email Parser

```bash
npm run test-parser
```

**Expected output:**
```
Testing HARO email parser...

Sample email structure:
{
  emailId: 'test-123',
  publication: 'Test Publication',
  category: 'Business & Finance',
  queries: [...]
}

✅ Parser test passed!
```

- [ ] Parser extracts queries correctly
- [ ] All fields populated (headline, deadline, journalist_email, etc.)

### 4. Test Cron Endpoints (Optional)

```bash
# Get CRON_SECRET from .env.local
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)

# Test poll-gmail endpoint
curl -X GET http://localhost:3000/api/cron/poll-gmail \
  -H "Authorization: Bearer $CRON_SECRET"

# Should return JSON with status
```

- [ ] Returns 200 OK
- [ ] No errors in console
- [ ] Processing stats returned

## 📦 Prepare for GitHub Push

### 1. Review Files to Commit

```bash
git status
```

**Should include:**
- [x] All source code files
- [x] Documentation files (README.md, DEPLOYMENT.md, etc.)
- [x] .env.example (with placeholders)
- [x] package.json and package-lock.json
- [x] Database migration scripts

**Should NOT include:**
- [ ] .env.local
- [ ] .env.production
- [ ] .env
- [ ] node_modules/
- [ ] .next/

### 2. Update Repository Information

Edit these files to add your contact information:

**SECURITY.md (line 9):**
```markdown
- **Email:** [Your security contact email here]
```

**README.md (line 205):**
Check that GitHub links point to correct repository:
```markdown
- **Issues:** [GitHub Issues](https://github.com/coloredsavage/HAROFilter/issues)
- **Discussions:** [GitHub Discussions](https://github.com/coloredsavage/HAROFilter/discussions)
```

### 3. Create Initial Commit

```bash
cd /Users/savage/HAROFilter/harofilter

# Check current branch
git branch

# Create main branch if needed
git checkout -b main

# Add all files
git add .

# Review what's being committed
git status

# Create initial commit
git commit -m "Initial commit: HAROFilter - HARO opportunity tracker

Features:
- Gmail API integration for HARO email ingestion
- Keyword matching engine
- Email notifications for matched queries
- User dashboard with query management
- Automated hourly polling via cron
- Daily digest emails
- 100% free tier deployment (Gmail, Supabase, Vercel, cron-job.org)

Documentation:
- Complete setup and deployment guides
- Security best practices
- Contributing guidelines
- MIT License"

# Verify commit
git log --oneline
```

### 4. Push to GitHub

```bash
# Add remote (if not already added)
git remote add origin https://github.com/coloredsavage/HAROFilter.git

# Verify remote
git remote -v

# Push to GitHub
git push -u origin main
```

## 🚀 Deploy to Vercel

### 1. Connect GitHub Repository to Vercel

1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Import `coloredsavage/HAROFilter`
4. **Framework Preset:** Next.js
5. **Root Directory:** `harofilter`
6. Click **Deploy** (will fail initially - need env vars)

### 2. Add Environment Variables to Vercel

**Go to Settings → Environment Variables and add:**

```env
# Copy these from your .env.local
NEXT_PUBLIC_SUPABASE_URL=<your_value>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_value>
GOOGLE_CLIENT_ID=<your_value>
GOOGLE_CLIENT_SECRET=<your_value>
GMAIL_REFRESH_TOKEN=<your_value>
GMAIL_USER=<your_value>
GMAIL_APP_PASSWORD=<your_value>

# Generate NEW values for production:
CRON_SECRET=<generate_new_with_openssl_rand_-base64_32>

# Update for production domain:
GOOGLE_REDIRECT_URL=https://your-domain.vercel.app/api/gmail/auth
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Checklist:**
- [ ] All environment variables added
- [ ] Scope set to "Production" (and "Preview" if desired)
- [ ] NEW `CRON_SECRET` generated for production (don't reuse local one)
- [ ] URLs updated for production domain

### 3. Redeploy After Adding Variables

1. Go to **Deployments** tab
2. Click **•••** on latest deployment → **Redeploy**
3. Uncheck "Use existing Build Cache"
4. Click **Redeploy**
5. Wait for deployment to complete
6. Click **Visit** to test

**Test deployed app:**
- [ ] Can access production URL
- [ ] Can sign up and log in
- [ ] Can add keywords
- [ ] Dashboard loads correctly

### 4. Update Google OAuth Redirect URI

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://your-domain.vercel.app/api/gmail/auth
   ```
4. Keep localhost URI for development
5. Click **Save**

## ⏰ Set Up Cron Jobs on cron-job.org

Follow the detailed guide in [CRON-JOB-ORG-SETUP.md](./CRON-JOB-ORG-SETUP.md)

**Quick checklist:**

### Job 1: Gmail Polling
- [ ] Title: `HAROFilter - Gmail Polling`
- [ ] URL: `https://your-domain.vercel.app/api/cron/poll-gmail`
- [ ] Schedule: Every hour (`0 * * * *`)
- [ ] Header: `Authorization: Bearer <PRODUCTION_CRON_SECRET>`
- [ ] Tested with "Execute now" - returns 200 OK

### Job 2: Daily Digest
- [ ] Title: `HAROFilter - Daily Digest`
- [ ] URL: `https://your-domain.vercel.app/api/cron/digest`
- [ ] Schedule: Daily at 08:00 (`0 8 * * *`)
- [ ] Header: `Authorization: Bearer <PRODUCTION_CRON_SECRET>`
- [ ] Tested with "Execute now" - returns 200 OK

### Job 3: Database Cleanup
- [ ] Title: `HAROFilter - Database Cleanup`
- [ ] URL: `https://your-domain.vercel.app/api/cron/cleanup`
- [ ] Schedule: Daily at 02:00 (`0 2 * * *`)
- [ ] Header: `Authorization: Bearer <PRODUCTION_CRON_SECRET>`
- [ ] Tested with "Execute now" - returns 200 OK

## 🎯 Final Verification

### Test End-to-End Flow

**Option 1: Wait for real HARO email**
- HARO sends emails 3x/day (morning, noon, evening EST)
- Wait for next scheduled email
- Verify cron job processes it

**Option 2: Manual test**
- Forward a HARO email to `untttld@gmail.com`
- Trigger manual cron execution in cron-job.org
- Verify queries appear in dashboard

**Checklist:**
- [ ] HARO email received in Gmail
- [ ] Cron job executed successfully (check cron-job.org logs)
- [ ] Queries extracted and saved to database (check Supabase)
- [ ] Keywords matched correctly (check user_queries table)
- [ ] Notification email sent (check inbox)
- [ ] Queries visible in dashboard
- [ ] Can interact with queries (Save, Responded buttons work)

### Monitor First 24 Hours

**Vercel:**
- [ ] Check **Functions** logs for cron execution
- [ ] Verify no errors in logs
- [ ] Monitor function execution times

**Supabase:**
- [ ] Check `haro_processing_logs` table
- [ ] Verify queries being inserted
- [ ] Check `email_notifications` for sent emails

**cron-job.org:**
- [ ] All 3 jobs showing green status
- [ ] Execution history shows 200 OK
- [ ] No failure notifications received

**Gmail:**
- [ ] API quota usage is normal (check Google Cloud Console)
- [ ] SMTP sending working (check sent folder)
- [ ] No bounced emails

## 🎉 Launch Checklist

- [ ] **Security verified** - no secrets in git
- [ ] **Local testing passed** - all flows work locally
- [ ] **Code pushed to GitHub** - repository is public
- [ ] **Deployed to Vercel** - production URL accessible
- [ ] **Environment variables set** - all secrets configured
- [ ] **Google OAuth updated** - production redirect URI added
- [ ] **Cron jobs configured** - all 3 jobs running on cron-job.org
- [ ] **End-to-end test passed** - full pipeline works in production
- [ ] **Documentation complete** - README, guides, security docs
- [ ] **Monitoring set up** - checking logs and execution

## 📋 Post-Launch

### Announce Your Project

**Update GitHub repository:**
- [ ] Add topics/tags: `haro`, `nextjs`, `gmail-api`, `supabase`, `vercel`
- [ ] Add description: "Never miss a HARO opportunity - automated matching and notifications"
- [ ] Add website URL (Vercel deployment)
- [ ] Add social preview image (optional)

**Share with community:**
- [ ] Post on Twitter/X with #HARO #buildinpublic
- [ ] Share in relevant Reddit communities (r/Entrepreneur, r/Marketing)
- [ ] Post on Indie Hackers
- [ ] Share on LinkedIn

### Ongoing Maintenance

**Weekly:**
- Review Vercel function logs
- Check cron-job.org execution
- Monitor email notification success rate

**Monthly:**
- Update dependencies (`npm outdated`, `npm audit`)
- Review Gmail API quota usage
- Check Supabase database size

**Quarterly:**
- Rotate CRON_SECRET
- Review OAuth test users
- Audit security policies

---

## 🆘 Need Help?

- **Documentation:** Check README.md, DEPLOYMENT.md, SECURITY.md
- **Issues:** https://github.com/coloredsavage/HAROFilter/issues
- **Discussions:** https://github.com/coloredsavage/HAROFilter/discussions

---

**Congratulations on building HAROFilter! 🎉**
