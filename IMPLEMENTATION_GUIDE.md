# HARO Email Integration - Implementation Guide

## Overview

This guide covers the complete HARO email integration implementation for HAROFilter. The system automatically fetches HARO emails from Gmail, parses them, matches queries to user keywords, and sends email notifications.

## What Was Built

### Phase 1: Database Setup ✅

**Files Created:**
- `scripts/003-add-email-columns.sql` - Database migration script

**What It Does:**
- Adds email metadata columns to `queries` table (haro_email_id, haro_category, source_email_received_at)
- Creates `email_notifications` table for tracking sent notifications
- Creates `haro_processing_logs` table for debugging and monitoring
- Sets up Row Level Security (RLS) policies

**Next Steps:**
1. Run the migration in Supabase SQL Editor:
   ```sql
   -- Copy and paste contents of scripts/003-add-email-columns.sql
   ```

### Phase 2: Email Parser ✅

**Files Created:**
- `types/haro.ts` - TypeScript interfaces for HARO data
- `lib/email/parser.ts` - HARO email parsing logic
- `scripts/test-parser.ts` - Parser testing script

**What It Does:**
- Parses HARO emails into individual queries
- Extracts: headline, full text, requirements, deadline, journalist email, publication
- Handles HTML and plain text emails
- Validates extracted data

**Test It:**
```bash
npm run test-parser
```

### Phase 3: Gmail API Integration ✅

**Files Created:**
- `lib/gmail/client.ts` - Gmail API client and email fetching
- `lib/gmail/auth.ts` - OAuth 2.0 authentication helpers
- `app/api/gmail/auth/route.ts` - OAuth callback handler

**What It Does:**
- Authenticates with Gmail API using OAuth 2.0
- Fetches unread HARO emails from inbox
- Marks processed emails as read
- Extracts email body, subject, and metadata

### Phase 4: Keyword Matching ✅

**Files Created:**
- `lib/email/matcher.ts` - Keyword matching logic

**What It Does:**
- Matches HARO queries to user keywords (case-insensitive, whole-word)
- Creates `user_queries` records for matches
- Tracks which keywords matched for each query

### Phase 5: Email Notifications ✅

**Files Created:**
- `lib/mailer/client.ts` - Nodemailer + Gmail SMTP setup
- `lib/mailer/templates/new-match.ts` - New match email template (HTML)
- `lib/mailer/templates/daily-digest.ts` - Daily digest email template (HTML)
- `lib/services/notification-service.ts` - Notification orchestration

**What It Does:**
- Sends beautiful HTML emails for new matches
- Sends daily digest summaries
- Respects user notification preferences
- Tracks notification delivery in database

### Phase 6: Query Processing ✅

**Files Created:**
- `lib/services/query-processor.ts` - Complete email processing pipeline

**What It Does:**
- Orchestrates the entire processing flow:
  1. Parse email → 2. Insert queries → 3. Match keywords → 4. Send notifications
- Logs all processing steps to database
- Handles errors gracefully without failing entire batch

### Phase 7: Cron Jobs ✅

**Files Created:**
- `app/api/cron/poll-gmail/route.ts` - Gmail polling (every hour)
- `app/api/cron/digest/route.ts` - Daily digest (8 AM daily)
- `app/api/cron/cleanup/route.ts` - Database cleanup (2 AM daily)
- `vercel.json` - Cron configuration for Vercel

**What It Does:**
- **Gmail Polling (Hourly)**: Fetches and processes new HARO emails
- **Daily Digest (8 AM)**: Sends summary of matches from last 24 hours
- **Cleanup (2 AM)**: Deletes queries older than 30 days and logs older than 90 days

### Phase 8: Testing & Configuration ✅

**Files Created:**
- `scripts/gmail-auth.ts` - Initial OAuth flow to get refresh token
- `scripts/test-gmail.ts` - Gmail API connection testing
- `.env.example` - Environment variable documentation
- Updated `package.json` with new dependencies and scripts

## Setup Instructions

### 1. Install Dependencies

Dependencies have already been installed. If you need to reinstall:

```bash
npm install
```

### 2. Run Database Migration

1. Open Supabase SQL Editor
2. Copy contents of `scripts/003-add-email-columns.sql`
3. Run the migration

### 3. Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "HAROFilter"
3. Enable Gmail API:
   - APIs & Services → Library → Search "Gmail API" → Enable
4. Create OAuth 2.0 credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Desktop app
   - Name: "HAROFilter Desktop"
   - Download JSON (you'll need client_id and client_secret)

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values:
   ```env
   # Existing Supabase values (already set)
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...

   # From Google Cloud Console OAuth credentials
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   GOOGLE_REDIRECT_URL=http://localhost:3000/api/gmail/auth

   # Gmail account for receiving HARO emails
   GMAIL_USER=untttld@gmail.com

   # Generate a random secret
   CRON_SECRET=$(openssl rand -base64 32)

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 5. Get Gmail Refresh Token

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Run the OAuth flow:
   ```bash
   npm run gmail-auth
   ```

3. Follow the instructions:
   - Visit the authorization URL in your browser
   - Sign in with `untttld@gmail.com`
   - Grant permissions
   - Copy the authorization code from the redirect URL
   - Paste it into the terminal

4. Copy the `GMAIL_REFRESH_TOKEN` to `.env.local`

5. Restart the dev server

### 6. Set Up Gmail App Password (For SMTP)

1. Enable 2-Factor Authentication on `untttld@gmail.com`:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. Generate App Password:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Name it "HAROFilter SMTP"
   - Copy the 16-character password

3. Add to `.env.local`:
   ```env
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### 7. Subscribe to HARO

1. Go to [helpareporter.com](https://www.helpareporter.com)
2. Sign up with `untttld@gmail.com`
3. Select ALL categories (Business, Tech, Lifestyle, etc.)
4. Confirm email subscription
5. HARO will send 3 emails per day (morning, noon, evening EST)

### 8. Test the Integration

1. **Test Gmail API connection:**
   ```bash
   npm run test-gmail
   ```

2. **Test email parser:**
   ```bash
   npm run test-parser
   ```

3. **Test full pipeline (manual trigger):**
   ```bash
   curl -X POST http://localhost:3000/api/cron/poll-gmail
   ```

4. **Check Supabase:**
   - Verify queries appear in `queries` table
   - Check `haro_processing_logs` for processing status
   - Look for `user_queries` records if keywords matched

## Monitoring & Debugging

### Check Processing Logs

Query the `haro_processing_logs` table in Supabase:

```sql
SELECT * FROM haro_processing_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Check Email Notifications

Query the `email_notifications` table:

```sql
SELECT
  n.*,
  p.email as user_email
FROM email_notifications n
JOIN profiles p ON p.id = n.user_id
ORDER BY n.sent_at DESC
LIMIT 10;
```

### Manual Cron Triggers (for testing)

```bash
# Poll Gmail
curl -X POST http://localhost:3000/api/cron/poll-gmail

# Send daily digest
curl -X POST http://localhost:3000/api/cron/digest

# Run cleanup
curl -X POST http://localhost:3000/api/cron/cleanup
```

### View Vercel Cron Logs (after deployment)

1. Go to Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Filter by "Cron Jobs"

## Deployment to Vercel

### 1. Set Environment Variables in Vercel

Add all variables from `.env.local` to Vercel:

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable (same names as `.env.local`)
3. Important: Set `NEXT_PUBLIC_APP_URL` to your production URL

### 2. Deploy

```bash
git add .
git commit -m "Add HARO email integration"
git push
```

Vercel will automatically deploy and enable cron jobs.

### 3. Verify Cron Jobs

1. Vercel Dashboard → Settings → Cron Jobs
2. You should see 3 cron jobs:
   - `/api/cron/poll-gmail` - Hourly
   - `/api/cron/digest` - Daily at 8 AM
   - `/api/cron/cleanup` - Daily at 2 AM

## Architecture Diagram

```
HARO Email (3x/day)
    ↓
untttld@gmail.com (Gmail inbox)
    ↓
Vercel Cron (every hour) → /api/cron/poll-gmail
    ↓
Gmail API → Fetch unread HARO emails
    ↓
Parser (lib/email/parser.ts) → Extract queries
    ↓
Database (Supabase) → Insert queries
    ↓
Matcher (lib/email/matcher.ts) → Match keywords
    ↓
Database → Create user_queries records
    ↓
Notification Service → Send emails (Nodemailer + Gmail SMTP)
    ↓
Gmail API → Mark emails as read
    ↓
User Dashboard Updates
```

## Cost Analysis

### Free Tier Limits

- **Gmail API**: 1 billion quota units/day (we use ~1,000/day)
- **Gmail SMTP**: 500 emails/day (we'll send <100/day)
- **Vercel Cron**: Unlimited on Hobby plan
- **Supabase**: 500 MB database (sufficient for ~1 year)

**Total Monthly Cost: $0** 🎉

## Troubleshooting

### Gmail API Errors

**"Invalid credentials"**
- Run `npm run gmail-auth` again to get a new refresh token
- Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` are correct

**"Insufficient permissions"**
- Check that Gmail API is enabled in Google Cloud Console
- Ensure OAuth scopes include `gmail.readonly` and `gmail.modify`

### Email Not Sending

**SMTP errors**
- Verify `GMAIL_APP_PASSWORD` is correct (16 characters, no spaces)
- Check that 2FA is enabled on Gmail account
- Test with: `npm run test-email` (you may need to create this script)

### No Queries Extracted

**Parser failing**
- Run `npm run test-parser` to verify parser works
- Check if HARO email format has changed
- Look at `haro_processing_logs` table for parse errors

### Queries Not Matching Keywords

- Verify keywords exist in database: `SELECT * FROM keywords;`
- Check keyword spelling and formatting (case-insensitive, whole-word matching)
- Test manually with specific keyword patterns

## Next Steps

1. **Run Database Migration** (scripts/003-add-email-columns.sql in Supabase)
2. **Set Up Google Cloud Project** and get OAuth credentials
3. **Configure .env.local** with all required variables
4. **Run Gmail Authentication** (npm run gmail-auth)
5. **Set Up Gmail App Password** for SMTP
6. **Subscribe to HARO** with untttld@gmail.com
7. **Test Everything** (npm run test-gmail, npm run test-parser)
8. **Deploy to Vercel** and verify cron jobs are running

## Support

For issues or questions:
- Check the `haro_processing_logs` table for errors
- Review Vercel deployment logs
- Verify all environment variables are set correctly
- Ensure Gmail API and SMTP are properly configured

---

**Implementation Complete! 🎉**

All phases (1-8) have been successfully implemented. Follow the setup instructions above to get the integration running.
