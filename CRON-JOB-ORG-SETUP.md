# Cron-Job.org Setup Guide

Since you're using [cron-job.org](https://cron-job.org) instead of Vercel Cron, follow these instructions to set up the scheduled jobs.

## Prerequisites

1. Account on cron-job.org
2. Your application deployed and accessible via a public URL
3. CRON_SECRET generated and set in environment variables

## Step 1: Generate CRON_SECRET

Run this command to generate a secure cron secret:

```bash
openssl rand -base64 32
```

Copy the output and add it to your `.env.local` file:

```env
CRON_SECRET=<paste_generated_secret_here>
```

**Important:** Also add this to your production environment variables (Vercel, Railway, etc.)

## Step 2: Update Cron Route Security

The cron routes are already set up to check for the CRON_SECRET. They expect it in the `Authorization` header as:

```
Authorization: Bearer YOUR_CRON_SECRET
```

## Step 3: Set Up Cron Jobs on cron-job.org

Log in to cron-job.org and create 3 new cron jobs:

### Job 1: Gmail Polling (Every Hour)

**Title:** HAROFilter - Gmail Polling

**URL:** `https://your-production-url.com/api/cron/poll-gmail`

**Schedule:** Every 1 hour (or use cron expression: `0 * * * *`)

**Request Method:** GET

**Custom Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```
(Replace `YOUR_CRON_SECRET` with the actual value from your .env file)

**Timeout:** 30 seconds

**Enable:** ✓

---

### Job 2: Daily Digest (8:00 AM Daily)

**Title:** HAROFilter - Daily Digest

**URL:** `https://your-production-url.com/api/cron/digest`

**Schedule:** Daily at 08:00 (or use cron expression: `0 8 * * *`)

**Request Method:** GET

**Custom Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Timeout:** 30 seconds

**Enable:** ✓

---

### Job 3: Database Cleanup (2:00 AM Daily)

**Title:** HAROFilter - Database Cleanup

**URL:** `https://your-production-url.com/api/cron/cleanup`

**Schedule:** Daily at 02:00 (or use cron expression: `0 2 * * *`)

**Request Method:** GET

**Custom Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Timeout:** 30 seconds

**Enable:** ✓

---

## Step 4: Test the Cron Jobs

### Test Locally (Development)

You can test the cron endpoints locally using curl:

```bash
# Replace YOUR_CRON_SECRET with the actual value from .env.local

# Test Gmail polling
curl -X GET http://localhost:3000/api/cron/poll-gmail \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test daily digest
curl -X GET http://localhost:3000/api/cron/digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test cleanup
curl -X GET http://localhost:3000/api/cron/cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Production

After setting up the jobs on cron-job.org:

1. Click "Execute now" on each job in the cron-job.org dashboard
2. Check the execution history to see if they succeeded (should return 200 OK)
3. Check your application logs for any errors

## Monitoring

### View Execution History

In cron-job.org dashboard:
1. Click on a job name
2. Go to "History" tab
3. View execution results, response codes, and response times

### View Application Logs

Check your processing logs in Supabase:

```sql
-- View recent processing logs
SELECT * FROM haro_processing_logs
ORDER BY created_at DESC
LIMIT 20;

-- View email notifications sent
SELECT * FROM email_notifications
ORDER BY sent_at DESC
LIMIT 20;
```

## Troubleshooting

### 401 Unauthorized Error

**Problem:** Cron job returns 401 status code

**Solution:**
- Verify CRON_SECRET is correctly set in your production environment variables
- Ensure the Authorization header is exactly: `Bearer YOUR_CRON_SECRET`
- Check there are no extra spaces or line breaks in the secret

### 500 Internal Server Error

**Problem:** Cron job returns 500 status code

**Solution:**
- Check application logs for the specific error
- Verify all environment variables are set in production
- Ensure database connection is working
- Check Gmail API credentials are valid

### Cron Job Not Executing

**Problem:** Jobs don't run at scheduled times

**Solution:**
- Verify jobs are enabled in cron-job.org dashboard
- Check your account status (free tier has limits)
- Ensure the schedule syntax is correct
- Try the "Execute now" button to test manually

### No Emails Being Fetched

**Problem:** Gmail polling runs but finds no emails

**Solution:**
- Verify HARO subscription is active for untttld@gmail.com
- Check that Gmail API credentials are valid
- Ensure GMAIL_REFRESH_TOKEN is set correctly
- Run `npm run test-gmail` locally to verify Gmail API connection

## Important Notes

1. **Free Tier Limits:** cron-job.org free tier typically allows:
   - Unlimited cron jobs
   - 1-minute minimum interval
   - Check their current limits at cron-job.org/pricing

2. **Execution Order:** The 3 jobs can run at different times:
   - Gmail Polling: Every hour (0:00, 1:00, 2:00, etc.)
   - Daily Digest: 8:00 AM daily
   - Cleanup: 2:00 AM daily

3. **Timezone:** Set the correct timezone in cron-job.org settings to match your desired schedule (e.g., EST for HARO email timing)

4. **Error Notifications:** Configure email notifications in cron-job.org settings to get alerts if a job fails

## Production Deployment Checklist

- [ ] CRON_SECRET generated and added to production environment
- [ ] All environment variables set in production (Gmail OAuth, SMTP, etc.)
- [ ] Application deployed and accessible via public URL
- [ ] 3 cron jobs created on cron-job.org with correct URLs
- [ ] Authorization headers added to all jobs
- [ ] Each job tested with "Execute now"
- [ ] Execution history shows 200 OK responses
- [ ] Email notifications configured for failed jobs
- [ ] Database migration (003-add-email-columns.sql) executed in production Supabase

---

**You're all set! The cron jobs will now run automatically on cron-job.org.**
