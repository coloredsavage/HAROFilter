# Claude AI Assistant Guide for HAROFilter

This file provides context for AI assistants (like Claude) working on this project.

## Project Overview

HAROFilter is a Next.js application that automatically monitors HARO (Help A Reporter Out) emails, matches queries to user keywords, and sends instant notifications when relevant opportunities appear.

## Technology Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + Auth)
- Gmail API (email ingestion)
- Nodemailer (email notifications)

**External Services:**
- Gmail API for fetching HARO emails
- Gmail SMTP for sending notifications
- cron-job.org for scheduled tasks
- Vercel for deployment

## Development Commands

```bash
# Start development server
npm run dev              # Runs on http://localhost:3000

# Build for production
npm run build
npm run start

# Linting
npm run lint
npm run lint -- --fix

# Gmail OAuth setup
npm run gmail-auth       # Interactive OAuth flow to get refresh token

# Testing
npm run test-gmail       # Test Gmail API connection
npm run test-parser      # Test HARO email parser
```

## Project Structure

```
harofilter/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── cron/         # Cron job endpoints (poll-gmail, digest, cleanup)
│   │   └── gmail/        # Gmail OAuth callbacks
│   ├── dashboard/        # Main dashboard pages
│   ├── login/            # Authentication pages
│   ├── onboarding/       # New user onboarding flow
│   └── settings/         # User settings
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── [feature]/        # Feature-specific components
├── lib/                   # Core utilities
│   ├── email/            # Email parser and keyword matcher
│   ├── gmail/            # Gmail API client and OAuth
│   ├── mailer/           # Email notification system
│   ├── services/         # Business logic (query-processor, notification-service)
│   └── utils.ts          # Shared utilities
├── scripts/              # Utility scripts
│   ├── gmail-auth.ts     # OAuth setup script
│   ├── test-gmail.ts     # Gmail API testing
│   └── test-parser.ts    # Email parser testing
├── types/                # TypeScript type definitions
│   └── haro.ts           # HARO-specific types
└── proxy.ts              # Next.js 16 middleware (formerly middleware.ts)
```

## Important Files

**Core Business Logic:**
- `lib/email/parser.ts` - Parses HARO emails into structured queries
- `lib/email/matcher.ts` - Matches queries to user keywords
- `lib/services/query-processor.ts` - Orchestrates entire email processing pipeline
- `lib/services/notification-service.ts` - Handles email notifications

**API Routes:**
- `app/api/cron/poll-gmail/route.ts` - Fetches and processes HARO emails (runs hourly)
- `app/api/cron/digest/route.ts` - Sends daily digest emails (runs 8 AM)
- `app/api/cron/cleanup/route.ts` - Deletes old queries (runs 2 AM)

**Authentication:**
- `proxy.ts` - Next.js 16 proxy for protected routes (NOT middleware.ts)

## Code Standards

### TypeScript
- **Strict typing required** - avoid `any`, use `unknown` and type guards
- **Interfaces over types** for object shapes
- **Prefer async/await** over promise chains

```typescript
// ✅ Good
interface UserSettings {
  email_new_matches: boolean;
  email_daily_digest: boolean;
}

async function fetchSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('profiles')
    .select('email_new_matches, email_daily_digest')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// ❌ Bad
function fetchSettings(userId: any) {
  return supabase.from('profiles').select('*').eq('id', userId);
}
```

### React
- **Functional components only** - no class components
- **Use hooks** for state and effects
- **Client components**: Add `"use client"` directive when needed

```typescript
// ✅ Good
"use client";

export default function KeywordList() {
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(() => {
    fetchKeywords();
  }, []);

  return <div>{/* JSX */}</div>;
}
```

### Naming Conventions
- **Files**:
  - Components: `PascalCase.tsx` (e.g., `KeywordList.tsx`)
  - Utilities: `kebab-case.ts` (e.g., `email-parser.ts`)
  - API routes: `route.ts` inside `kebab-case/` directories
- **Variables/Functions**: `camelCase`
- **Components/Types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`

### Import Organization
```typescript
// 1. External dependencies
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 2. Internal utilities
import { cn } from '@/lib/utils';
import { parseHaroEmail } from '@/lib/email/parser';

// 3. Components
import { Button } from '@/components/ui/button';
import { KeywordList } from '@/components/keywords/KeywordList';

// 4. Types
import type { HaroQuery } from '@/types/haro';
```

## Database Access

**Always use Supabase client with proper typing:**

```typescript
// ✅ Good - Type-safe query
const { data, error } = await supabase
  .from('queries')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error('Database error:', error);
  throw new Error('Failed to fetch queries');
}

// ❌ Bad - No error handling
const { data } = await supabase.from('queries').select('*');
```

**Row Level Security (RLS) is enabled on all tables** - queries automatically filter by authenticated user.

## Environment Variables

**Required for development:**
```env
NEXT_PUBLIC_SUPABASE_URL=         # Public Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public anon key (RLS protected)
GOOGLE_CLIENT_ID=                  # Gmail OAuth client ID
GOOGLE_CLIENT_SECRET=              # Gmail OAuth secret (PRIVATE)
GMAIL_REFRESH_TOKEN=               # OAuth refresh token (PRIVATE)
GMAIL_USER=                        # Gmail address for sending emails
GMAIL_APP_PASSWORD=                # Gmail SMTP app password (PRIVATE)
CRON_SECRET=                       # Random secret for cron security (PRIVATE)
NEXT_PUBLIC_APP_URL=               # Application URL
```

## Critical Warnings

### ⚠️ NEVER:
1. **Commit secrets to Git**
   - `.env.local`, `.env.production` are gitignored
   - Only commit `.env.example` with placeholders

2. **Run database migrations without review**
   - Migrations in `scripts/` must be reviewed before running
   - Run migrations in Supabase SQL Editor, not programmatically

3. **Use `any` type in TypeScript**
   - Use `unknown` and type guards instead
   - Maintain strict type safety

4. **Skip error handling in async functions**
   - Always handle promise rejections
   - Provide user-friendly error messages

5. **Modify RLS policies without testing**
   - RLS policies protect user data
   - Test policy changes thoroughly

### ✅ ALWAYS:
1. **Use environment variables for secrets**
   - Never hardcode credentials
   - Check `process.env` values exist

2. **Validate user input**
   - Sanitize before database operations
   - Use Zod or similar for validation

3. **Test Gmail API changes locally**
   - Use `npm run test-gmail` before deploying
   - Verify OAuth flow works

4. **Check cron endpoint security**
   - All `/api/cron/*` routes require `Authorization: Bearer CRON_SECRET`
   - Return 401 if header missing or incorrect

## Common Tasks

### Adding a new cron job
1. Create route in `app/api/cron/[job-name]/route.ts`
2. Add authorization check:
   ```typescript
   const authHeader = request.headers.get('authorization');
   if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```
3. Implement job logic
4. Add to cron-job.org with Authorization header
5. Document in `CRON-JOB-ORG-SETUP.md`

### Modifying HARO email parser
1. Update regex patterns in `lib/email/parser.ts`
2. Add test cases in `scripts/test-parser.ts`
3. Run `npm run test-parser` to verify
4. Test with real HARO email if possible

### Adding a new keyword matching feature
1. Update `lib/email/matcher.ts`
2. Consider database schema changes (new columns/tables)
3. Update TypeScript types in `types/haro.ts`
4. Test thoroughly with edge cases

## Testing Locally

**Full end-to-end test:**
1. Start dev server: `npm run dev`
2. Create test user account
3. Add keywords in settings
4. Send test HARO email to your Gmail
5. Manually trigger cron:
   ```bash
   curl -X GET http://localhost:3000/api/cron/poll-gmail \
     -H "Authorization: Bearer $CRON_SECRET"
   ```
6. Verify queries appear in dashboard
7. Check notification email received

## Deployment Context

**Platform:** Vercel
**Cron Jobs:** cron-job.org (external service)
**Database:** Supabase (PostgreSQL)
**Email:** Gmail API (receiving) + Gmail SMTP (sending)

**Production URLs must be updated in:**
- Google Cloud Console OAuth redirect URIs
- `NEXT_PUBLIC_APP_URL` environment variable
- cron-job.org job URLs

## Help & Resources

- **Documentation:** See README.md, DEPLOYMENT.md, SECURITY.md
- **Issues:** https://github.com/coloredsavage/HAROFilter/issues
- **Discussions:** https://github.com/coloredsavage/HAROFilter/discussions

---

**This file helps AI assistants provide better, context-aware assistance. Keep it updated as the project evolves!**
