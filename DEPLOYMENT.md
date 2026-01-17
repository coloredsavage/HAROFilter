# Deployment Guide

Complete guide for deploying HAROFilter to production using Vercel, Supabase, and cron-job.org.

## Prerequisites

Before deploying, ensure you have:

- [x] Completed local development setup (see [README.md](./README.md))
- [x] Tested Gmail OAuth authentication locally
- [x] Verified email parsing and keyword matching work
- [x] Created a GitHub repository
- [x] A Vercel account (free tier)
- [x] A cron-job.org account (free tier)

## Deployment Steps

### 1. Prepare GitHub Repository

**Push your code to GitHub:**

```bash
cd /Users/savage/HAROFilter/harofilter

# Initialize git if not already done
git init

# Add remote (replace with your repository)
git remote add origin https://github.com/yourusername/HAROFilter.git

# Verify .gitignore includes sensitive files
cat .gitignore | grep ".env"

# Should show:
# .env*.local
# .env.production

# Add and commit
git add .
git commit -m "Initial commit"
git push -u origin main
```

**CRITICAL: Verify no secrets in Git history:**

```bash
# Check for accidentally committed secrets
git log --all --full-history -- .env.local
git log --all --full-history -- .env.production

# If secrets found, use git-filter-repo to remove them:
# https://github.com/newren/git-filter-repo
```

### 2. Set Up Production Database

**Create production tables in Supabase:**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run migrations in order:

```sql
-- 1. Run initial schema (if not already done)
-- Copy content from scripts/001-initial-schema.sql

-- 2. Run email integration migration
-- Copy content from scripts/003-add-email-columns.sql
```

**Verify Row Level Security (RLS) policies:**

```sql
-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'keywords', 'queries', 'user_queries', 'email_notifications');

-- All rows should show rowsecurity = true
```

### 3. Configure Google Cloud Console for Production

**Update OAuth Redirect URIs:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add your production domain:
   ```
   https://yourdomain.com/api/gmail/auth
   ```
4. Keep the localhost URI for development:
   ```
   http://localhost:3000/api/gmail/auth
   ```
5. Click **Save**

**OAuth Consent Screen (if publishing):**

If you need more than 100 users, you must publish your app:

1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Click **Publish App**
3. Note: This requires Google verification (7+ day review process)
4. For <100 users, keep app in "Testing" mode and add users manually

### 4. Deploy to Vercel

**Connect GitHub repository:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. **Framework Preset:** Next.js
5. **Root Directory:** `harofilter` (if using monorepo structure)
6. Click **Deploy**

**Configure environment variables:**

After initial deployment, go to **Settings** → **Environment Variables** and add:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Gmail OAuth (use same refresh token from local setup)
GMAIL_REFRESH_TOKEN=your_refresh_token
GOOGLE_REDIRECT_URL=https://yourdomain.com/api/gmail/auth

# Gmail SMTP
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Cron Security (generate new one for production)
CRON_SECRET=your_production_cron_secret

# Application URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Generate production `CRON_SECRET`:**

```bash
openssl rand -base64 32
```

**Set environment scope:**

- **Production:** Set for production deployments
- **Preview:** Optional, can use same values or separate test credentials
- **Development:** Not needed (uses local `.env.local`)

**Redeploy after adding variables:**

1. Go to **Deployments** tab
2. Click **•••** on latest deployment → **Redeploy**
3. Check **Use existing Build Cache** is unchecked
4. Click **Redeploy**

### 5. Configure Custom Domain (Optional)

**Add custom domain:**

1. In Vercel project, go to **Settings** → **Domains**
2. Add your domain: `yourdomain.com`
3. Follow DNS configuration instructions
4. Vercel automatically provisions SSL certificate

**Update OAuth redirect URI:**

1. Go back to Google Cloud Console
2. Update redirect URI to match your custom domain
3. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables

### 6. Set Up cron-job.org

**Create three scheduled jobs:**

#### Job 1: Gmail Polling (Hourly)

1. Go to [cron-job.org](https://cron-job.org/)
2. Click **Create Cron Job**
3. **Title:** HAROFilter - Gmail Polling
4. **Address:** `https://yourdomain.com/api/cron/poll-gmail`
5. **Schedule:**
   - **Every:** 1 hour
   - **Execution:** Every hour at minute 0
   - Pattern: `0 * * * *`
6. **Request Method:** GET
7. **Headers:** Add custom header:
   ```
   Header: Authorization
   Value: Bearer YOUR_PRODUCTION_CRON_SECRET
   ```
8. **Notifications:** Enable email notifications for failures
9. Click **Create**

#### Job 2: Daily Digest (8 AM Daily)

1. Click **Create Cron Job**
2. **Title:** HAROFilter - Daily Digest
3. **Address:** `https://yourdomain.com/api/cron/digest`
4. **Schedule:**
   - **Every:** day
   - **At:** 08:00 (your timezone)
   - Pattern: `0 8 * * *`
5. **Request Method:** GET
6. **Headers:** Add custom header:
   ```
   Header: Authorization
   Value: Bearer YOUR_PRODUCTION_CRON_SECRET
   ```
7. Click **Create**

#### Job 3: Database Cleanup (2 AM Daily)

1. Click **Create Cron Job**
2. **Title:** HAROFilter - Database Cleanup
3. **Address:** `https://yourdomain.com/api/cron/cleanup`
4. **Schedule:**
   - **Every:** day
   - **At:** 02:00 (your timezone)
   - Pattern: `0 2 * * *`
5. **Request Method:** GET
6. **Headers:** Add custom header:
   ```
   Header: Authorization
   Value: Bearer YOUR_PRODUCTION_CRON_SECRET
   ```
7. Click **Create**

**Verify cron jobs:**

- Check **Execution Log** after first run
- Verify jobs return `200 OK` status
- Check Vercel **Functions** logs for execution details

### 7. Verify Deployment

**Test critical flows:**

1. **Authentication:**
   - Visit `https://yourdomain.com`
   - Sign up with new account
   - Verify email/password login works
   - Check onboarding flow

2. **Keyword setup:**
   - Add keywords in settings
   - Verify keywords saved in database (check Supabase)

3. **Gmail polling (manual test):**
   - Send test HARO email to your Gmail address
   - Trigger manual cron job execution in cron-job.org
   - OR wait for next hourly execution
   - Check Vercel logs for execution
   - Verify queries appear in database
   - Check dashboard shows queries

4. **Email notifications:**
   - Verify notification email received
   - Check email formatting
   - Test dashboard link in email

5. **Cron jobs:**
   - Monitor cron-job.org execution logs
   - Check Vercel function logs
   - Verify all three jobs execute successfully

### 8. Production Monitoring

**Set up monitoring and alerts:**

**Vercel Monitoring:**

1. **Function Logs:**
   - Go to **Deployments** → **Functions** tab
   - Monitor `/api/cron/poll-gmail` execution
   - Set up error alerts (available in Pro plan)

2. **Analytics:**
   - Go to **Analytics** tab
   - Monitor page views and user activity
   - Track API route performance

**Supabase Monitoring:**

1. **Database:**
   - Go to **Database** → **Logs**
   - Monitor query performance
   - Check connection pool usage

2. **Auth:**
   - Go to **Authentication** → **Users**
   - Monitor new signups
   - Check for suspicious activity

**Gmail API Monitoring:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/dashboard)
2. Check **Gmail API** quota usage
3. Monitor daily quota (1 billion units/day - very high limit)
4. Set up quota alerts at 80% usage

**Email Delivery Monitoring:**

1. Check `email_notifications` table in Supabase
2. Query for failed notifications:
   ```sql
   SELECT * FROM email_notifications
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 100;
   ```
3. Monitor Gmail SMTP daily limit (500 emails/day)

**cron-job.org Monitoring:**

1. Enable email notifications for job failures
2. Check **Execution Log** weekly
3. Verify jobs run on schedule
4. Monitor response times

### 9. Post-Deployment Checklist

**Security:**

- [ ] All environment variables set in Vercel
- [ ] `CRON_SECRET` is strong and unique for production
- [ ] No secrets in Git repository
- [ ] OAuth redirect URIs updated for production domain
- [ ] Supabase RLS policies enabled
- [ ] HTTPS enabled (automatic with Vercel)

**Functionality:**

- [ ] User signup/login works
- [ ] Keyword management works
- [ ] Gmail polling executes hourly
- [ ] Email parsing extracts queries correctly
- [ ] Keyword matching creates user_queries
- [ ] Email notifications sent successfully
- [ ] Dashboard displays matched queries
- [ ] Daily digest sent at 8 AM
- [ ] Database cleanup runs at 2 AM

**Monitoring:**

- [ ] Vercel function logs reviewed
- [ ] Supabase database logs reviewed
- [ ] cron-job.org execution verified
- [ ] Gmail API quota monitored
- [ ] Error alerts configured

### 10. Scaling Considerations

**Current free tier limits:**

- **Vercel:** 100 GB bandwidth/month, 6,000 function execution minutes/month
- **Supabase:** 500 MB database, 2 GB bandwidth/month, 50,000 monthly active users
- **Gmail API:** 1 billion quota units/day (each read = 5 units)
- **Gmail SMTP:** 500 emails/day

**When to upgrade:**

- **Database:** If queries table exceeds 500 MB (after ~1-2 years with cleanup)
- **Bandwidth:** If dashboard gets >10,000 daily active users
- **Email:** If sending >500 notifications/day (need paid email service like SendGrid)
- **Functions:** If cron jobs take >10 seconds and execute frequently

**Optimization tips:**

1. **Database cleanup:**
   - Adjust cleanup schedule to delete queries older than 7-14 days (currently 30 days)
   - Archive important queries to separate table

2. **Email batching:**
   - Send daily digest instead of individual notifications
   - Batch multiple matches into single email

3. **Caching:**
   - Cache frequently accessed queries in Redis (if needed)
   - Use Vercel Edge caching for static content

4. **Database indexes:**
   - Already created on `keywords.user_id`, `queries.created_at`
   - Add indexes if queries slow down

## Troubleshooting

### Gmail polling not working

**Check:**
1. Vercel function logs for errors
2. Gmail API quota in Google Cloud Console
3. `GMAIL_REFRESH_TOKEN` is correct
4. OAuth redirect URI matches production domain
5. cron-job.org authorization header has correct `CRON_SECRET`

**Fix:**
```bash
# Re-run OAuth flow to get fresh refresh token
npm run gmail-auth

# Update GMAIL_REFRESH_TOKEN in Vercel
# Redeploy
```

### Email notifications not sending

**Check:**
1. `email_notifications` table for error messages
2. Gmail SMTP app password is correct
3. Gmail daily limit not exceeded (500/day)
4. `GMAIL_USER` and `GMAIL_APP_PASSWORD` set correctly

**Fix:**
```bash
# Generate new app password
# Go to https://myaccount.google.com/apppasswords
# Update GMAIL_APP_PASSWORD in Vercel
```

### Cron jobs not executing

**Check:**
1. cron-job.org execution log
2. Authorization header matches `CRON_SECRET`
3. Vercel function logs

**Fix:**
- Update authorization header in cron-job.org
- Verify `CRON_SECRET` in Vercel matches
- Check Vercel function is not timing out (30s limit for Hobby plan)

### OAuth redirect errors in production

**Check:**
1. Google Cloud Console redirect URIs include production domain
2. `GOOGLE_REDIRECT_URL` environment variable matches production
3. Domain has HTTPS enabled

**Fix:**
```bash
# Update redirect URI in Google Cloud Console
https://yourdomain.com/api/gmail/auth

# Update environment variable in Vercel
GOOGLE_REDIRECT_URL=https://yourdomain.com/api/gmail/auth

# Redeploy
```

## Maintenance

**Weekly:**
- Review Vercel function logs for errors
- Check cron-job.org execution logs
- Monitor email notification success rate

**Monthly:**
- Review Gmail API quota usage
- Update dependencies (`npm outdated`, `npm audit`)
- Check Supabase database size
- Review Supabase auth logs for suspicious activity

**Quarterly:**
- Rotate `CRON_SECRET`
- Review and update OAuth test users
- Audit Supabase RLS policies
- Review and optimize database queries

---

**Deployment complete!** Your HAROFilter instance should now be running in production.

For ongoing support, see:
- [README.md](./README.md) - General documentation
- [SECURITY.md](./SECURITY.md) - Security best practices
- [CRON-JOB-ORG-SETUP.md](./CRON-JOB-ORG-SETUP.md) - Detailed cron setup
