# Security Policy

## Reporting Security Vulnerabilities

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, please report security vulnerabilities by emailing:
- **Email:** [Your security contact email here]
- **Subject:** `[SECURITY] HAROFilter - [Brief Description]`

We will respond within 48 hours and work with you to understand and address the issue.

## Security Best Practices

### Environment Variables

**CRITICAL: Never commit sensitive credentials to Git**

All sensitive information must be stored in environment variables:

```bash
# ❌ NEVER commit these files
.env.local
.env.production
.env

# ✅ These are safe to commit
.env.example
```

**Required Environment Variables:**

```env
# Supabase (Public - OK to expose in frontend)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  # Rate-limited, protected by RLS

# Google OAuth (PRIVATE - Server-side only)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx  # ⚠️ CRITICAL: Keep secret

# Gmail OAuth (PRIVATE - Server-side only)
GMAIL_REFRESH_TOKEN=xxx  # ⚠️ CRITICAL: Keep secret
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=xxx  # ⚠️ CRITICAL: Keep secret

# Cron Security (PRIVATE - Server-side only)
CRON_SECRET=xxx  # ⚠️ CRITICAL: Keep secret
```

### OAuth Credentials Protection

**Google OAuth Credentials:**

1. **Never share your `GOOGLE_CLIENT_SECRET`**
   - Treat it like a password
   - Rotate immediately if exposed
   - Store only in environment variables

2. **Protect your `GMAIL_REFRESH_TOKEN`**
   - Grants access to your Gmail account
   - Can read and modify emails
   - Rotate by re-running OAuth flow if compromised

3. **Limit OAuth Scopes**
   - Only use `gmail.readonly` and `gmail.modify`
   - Never request broader scopes than needed

4. **Use Test Users During Development**
   - Add only necessary email addresses to OAuth consent screen test users
   - Remove test users when publishing app

**Gmail App Password:**

1. **Generate app-specific passwords**
   - Go to https://myaccount.google.com/apppasswords
   - Create a unique password for HAROFilter
   - Revoke immediately if compromised

2. **Enable 2-Factor Authentication**
   - Required for app passwords
   - Adds additional account security

### Database Security

**Supabase Row Level Security (RLS):**

All tables have RLS policies enabled:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view own keywords"
  ON keywords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own queries"
  ON user_queries FOR SELECT
  USING (auth.uid() = user_id);
```

**Database Connection:**

- Use Supabase's `anon` key for client-side requests (rate-limited and protected by RLS)
- Never use `service_role` key in client-side code
- Server-side API routes can use service role if needed, but prefer RLS-protected queries

### Cron Job Security

**Protecting Cron Endpoints:**

All cron endpoints require authentication:

```typescript
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... rest of handler
}
```

**Generate a strong `CRON_SECRET`:**

```bash
# Generate a random 32-character secret
openssl rand -base64 32
```

**Configure cron-job.org with Authorization header:**

```
Authorization: Bearer your_cron_secret_here
```

**Rotate `CRON_SECRET` regularly:**
- Update environment variable in Vercel
- Update Authorization header in cron-job.org
- Do this at least quarterly or if compromised

### Email Security

**SMTP Configuration:**

1. **Use App Passwords, not account passwords**
   - More secure than main account password
   - Can be revoked without changing account password

2. **Rate Limiting:**
   - Gmail SMTP: 500 emails/day limit
   - Implement application-level rate limiting
   - Track sent emails in `email_notifications` table

3. **Email Content Security:**
   - Sanitize user-generated content before sending
   - Validate email addresses before sending
   - Use HTML email templates with proper escaping

### Production Deployment Security

**Vercel Deployment:**

1. **Environment Variables:**
   - Set all secrets in Vercel dashboard (Settings → Environment Variables)
   - Use separate values for Preview and Production environments
   - Never log environment variables

2. **Domain Security:**
   - Enable HTTPS (automatic with Vercel)
   - Configure proper CORS headers
   - Set secure cookie attributes

3. **Update Redirect URIs:**
   - Add production domain to Google Cloud Console OAuth redirect URIs
   - Example: `https://yourdomain.com/api/gmail/auth`

**OAuth Consent Screen:**

1. **Publishing Status:**
   - Keep app in "Testing" mode unless you need >100 users
   - "Testing" mode requires adding each user manually (more secure)
   - "Production" mode requires Google verification (7+ day review process)

2. **Test Users:**
   - Add only necessary email addresses
   - Remove test users when they no longer need access

### Code Security

**Input Validation:**

1. **Validate all user inputs:**
   ```typescript
   // Example: Validate keyword input
   if (keyword.length > 100 || keyword.length < 2) {
     throw new Error('Invalid keyword length');
   }
   ```

2. **Sanitize email content:**
   ```typescript
   // Use libraries like DOMPurify for HTML sanitization
   import DOMPurify from 'isomorphic-dompurify';
   const cleanHtml = DOMPurify.sanitize(dirtyHtml);
   ```

3. **Prevent SQL Injection:**
   - Always use parameterized queries
   - Supabase client handles this automatically
   ```typescript
   // ✅ Safe
   await supabase.from('queries').select().eq('id', userId);

   // ❌ Never construct raw SQL from user input
   ```

**Dependencies:**

1. **Keep dependencies updated:**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Review dependency security:**
   - Check for known vulnerabilities before installing
   - Use `npm outdated` to find outdated packages
   - Pin major versions to prevent breaking changes

### Incident Response

**If credentials are compromised:**

1. **Immediately rotate affected credentials:**
   - Google OAuth: Delete and recreate credentials
   - Gmail App Password: Revoke and generate new one
   - Cron Secret: Generate and update everywhere
   - Supabase: Rotate database passwords if applicable

2. **Revoke access:**
   - Gmail OAuth tokens: Revoke at https://myaccount.google.com/permissions
   - Check Supabase logs for unauthorized access

3. **Update deployed applications:**
   - Update environment variables in Vercel
   - Redeploy application
   - Update cron-job.org configurations

4. **Audit access:**
   - Check database logs
   - Review email sent logs
   - Look for suspicious activity

**If a security vulnerability is discovered:**

1. **Assess impact:**
   - What data could be accessed?
   - How many users affected?
   - Is active exploitation occurring?

2. **Develop and test fix:**
   - Create patch in private branch
   - Test thoroughly
   - Prepare deployment

3. **Deploy fix:**
   - Deploy to production immediately
   - Monitor for issues

4. **Notify affected users:**
   - If user data was compromised
   - Provide clear guidance on actions to take

5. **Public disclosure:**
   - After fix is deployed
   - Credit reporter (if they wish)
   - Document in CHANGELOG

## Security Checklist

**Before deploying to production:**

- [ ] All sensitive environment variables set in Vercel
- [ ] `.env.local` and `.env.production` in `.gitignore`
- [ ] Strong `CRON_SECRET` generated and configured
- [ ] OAuth redirect URIs include production domain
- [ ] Gmail OAuth refresh token secured
- [ ] Gmail App Password secured
- [ ] Supabase RLS policies enabled on all tables
- [ ] Test users added to OAuth consent screen (if in Testing mode)
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] No credentials in Git history
- [ ] Dependencies audited (`npm audit`)

**Regular maintenance:**

- [ ] Rotate `CRON_SECRET` quarterly
- [ ] Review OAuth consent screen test users monthly
- [ ] Update dependencies monthly (`npm outdated`, `npm audit`)
- [ ] Review Supabase access logs monthly
- [ ] Check email notification logs for anomalies weekly

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/managing-user-data#row-level-security)
- [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/web-server#authorization-errors)
- [Vercel Security](https://vercel.com/docs/security)

---

**Remember: Security is an ongoing process, not a one-time checklist.**
