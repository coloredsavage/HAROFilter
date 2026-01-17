# Contributing to HAROFilter

Thank you for your interest in contributing to HAROFilter! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

### Our Standards

**Examples of behavior that contributes to a positive environment:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When reporting a bug, include:**

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Environment details:**
  - Node.js version (`node --version`)
  - npm version (`npm --version`)
  - Operating system
  - Browser (if frontend issue)
- **Error messages** (full stack trace if available)
- **Additional context** (when did it start, what changed, etc.)

**Example bug report:**

```markdown
## Bug: Email notifications not sending after keyword match

**Steps to Reproduce:**
1. Add keyword "technology" in settings
2. Wait for HARO email with matching query
3. Check email inbox

**Expected:** Should receive notification email
**Actual:** No email received, but query appears in dashboard

**Environment:**
- Node.js: v20.10.0
- npm: 10.2.5
- OS: macOS 14.1
- Vercel deployment

**Error in logs:**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Additional context:**
Started happening after deploying to production. Works fine locally.
```

### Suggesting Features

We love new ideas! Before suggesting a feature:

1. **Check existing issues** for similar suggestions
2. **Consider the scope** - does it align with HAROFilter's goals?
3. **Think about the implementation** - is it feasible with current tech stack?

**When suggesting a feature, include:**

- **Clear use case** - why is this needed?
- **Proposed solution** - how should it work?
- **Alternatives considered** - any other approaches?
- **Additional context** - mockups, examples from other tools, etc.

**Example feature request:**

```markdown
## Feature: Slack integration for notifications

**Use Case:**
Many teams use Slack for communication. Getting HARO notifications in Slack would help teams collaborate on opportunities faster.

**Proposed Solution:**
- Add Slack webhook URL field in user settings
- Send formatted Slack messages when new queries match keywords
- Include quick action buttons (Claim, Ignore)

**Alternatives:**
- Email-to-Slack forwarding (less seamless)
- Zapier integration (requires third-party service)

**Additional Context:**
Similar to how Ahrefs sends notifications: [screenshot]
```

### Contributing Code

We welcome code contributions! Here are areas where contributions are especially valuable:

**High Priority:**
- Bug fixes
- Performance improvements
- Test coverage
- Documentation improvements
- Accessibility enhancements

**Feature Contributions:**
- AI-powered query summarization
- Advanced keyword matching (synonyms, NLP)
- Browser extension
- Mobile app
- Integrations (Slack, Discord, etc.)
- Analytics dashboard

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- A Gmail account
- A Supabase account (free tier)
- A Vercel account (optional, for testing deployment)

### Local Setup

1. **Fork the repository:**
   - Click "Fork" button on GitHub
   - Clone your fork:
     ```bash
     git clone https://github.com/yourusername/HAROFilter.git
     cd HAROFilter/harofilter
     ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your credentials (see [README.md](./README.md) for details)

4. **Run database migrations:**
   - Go to Supabase Dashboard → SQL Editor
   - Run scripts in `scripts/` directory

5. **Set up Gmail OAuth:**
   ```bash
   npm run gmail-auth
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

7. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

1. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic

2. **Test your changes**
   - Test manually in browser
   - Run linter: `npm run lint`
   - Fix any errors: `npm run lint -- --fix`

3. **Commit your changes**
   - Follow [commit guidelines](#commit-guidelines)
   - Make atomic commits (one logical change per commit)

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to original repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in PR template

## Coding Standards

### TypeScript

**Use strict typing:**

```typescript
// ✅ Good
interface UserSettings {
  email_new_matches: boolean;
  email_daily_digest: boolean;
  notification_email?: string;
}

function updateSettings(settings: UserSettings): Promise<void> {
  // Implementation
}

// ❌ Bad
function updateSettings(settings: any) {
  // Implementation
}
```

**Avoid `any` type:**

```typescript
// ✅ Good
const data: unknown = JSON.parse(jsonString);
if (typeof data === 'object' && data !== null) {
  // Safe to use
}

// ❌ Bad
const data: any = JSON.parse(jsonString);
```

### React/Next.js

**Use functional components with hooks:**

```typescript
// ✅ Good
export default function KeywordSettings() {
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(() => {
    fetchKeywords();
  }, []);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}

// ❌ Bad (class components)
export default class KeywordSettings extends React.Component {
  // Don't use class components
}
```

**Use async/await over promises:**

```typescript
// ✅ Good
async function fetchQueries() {
  try {
    const { data, error } = await supabase
      .from('queries')
      .select('*');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching queries:', error);
    throw error;
  }
}

// ❌ Bad
function fetchQueries() {
  return supabase
    .from('queries')
    .select('*')
    .then(({ data, error }) => {
      if (error) throw error;
      return data;
    })
    .catch(error => {
      console.error('Error fetching queries:', error);
      throw error;
    });
}
```

### Database

**Always use parameterized queries:**

```typescript
// ✅ Good
const { data } = await supabase
  .from('keywords')
  .select('*')
  .eq('user_id', userId);

// ❌ Bad (SQL injection risk)
const query = `SELECT * FROM keywords WHERE user_id = '${userId}'`;
```

**Use transactions for multiple operations:**

```typescript
// ✅ Good
await supabase.rpc('process_haro_email', {
  email_body: body,
  email_id: id,
});

// Implementation in Supabase function uses transaction
```

### Error Handling

**Always handle errors gracefully:**

```typescript
// ✅ Good
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  // Log to monitoring service
  // Show user-friendly message
  throw new Error('Failed to complete operation. Please try again.');
}

// ❌ Bad
const result = await riskyOperation(); // Unhandled promise rejection
```

**Provide user-friendly error messages:**

```typescript
// ✅ Good
catch (error) {
  if (error.code === 'PGRST116') {
    toast.error('You need to add at least one keyword first.');
  } else {
    toast.error('Something went wrong. Please try again.');
  }
}

// ❌ Bad
catch (error) {
  alert(error.message); // Shows technical error to user
}
```

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `KeywordList.tsx`)
- Utilities: `kebab-case.ts` (e.g., `email-parser.ts`)
- API routes: `kebab-case/route.ts` (e.g., `poll-gmail/route.ts`)

**Variables/Functions:**
- Use `camelCase` for variables and functions
- Use `PascalCase` for components and types
- Use `UPPER_SNAKE_CASE` for constants

```typescript
// ✅ Good
const userEmail = 'user@example.com';
function fetchUserData() { }
const MAX_RETRIES = 3;
interface UserProfile { }

// ❌ Bad
const UserEmail = 'user@example.com';
function FetchUserData() { }
const max_retries = 3;
```

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks (dependencies, build config)

**Examples:**

```bash
# Feature
feat(keywords): add bulk keyword import from CSV

# Bug fix
fix(gmail): handle missing email body gracefully

# Documentation
docs(readme): add troubleshooting section for OAuth errors

# Refactor
refactor(parser): simplify regex patterns for better performance
```

**Good commit messages:**

```
✅ feat(notifications): add Slack integration for new matches

Added Slack webhook support to send notifications to Slack channels.
Users can configure webhook URL in settings.

Closes #42
```

**Bad commit messages:**

```
❌ fix stuff
❌ WIP
❌ asdfasdf
❌ Fixed the thing that was broken
```

## Pull Request Process

### Before Submitting

1. **Update documentation** if you changed functionality
2. **Test your changes** thoroughly
3. **Run linter** and fix any issues
4. **Update CHANGELOG.md** with your changes (if applicable)
5. **Ensure no merge conflicts** with main branch

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] I have tested this locally
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] All existing tests pass

## Checklist
- [ ] My code follows the project's code style
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings or errors
- [ ] I have checked for merge conflicts

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Closes #123
Fixes #456
```

### Review Process

1. **Maintainer review:** A maintainer will review your PR within 1-7 days
2. **Feedback:** Address any requested changes
3. **Approval:** Once approved, a maintainer will merge your PR
4. **Deployment:** Changes will be deployed to production after merge

### PR Best Practices

- **Keep PRs small** - easier to review, less likely to introduce bugs
- **One feature per PR** - don't mix multiple unrelated changes
- **Descriptive title** - clearly state what the PR does
- **Reference issues** - link related issues in description
- **Respond to feedback** - engage in discussion, explain your decisions

## Code Review Guidelines

When reviewing PRs, consider:

**Functionality:**
- Does it work as intended?
- Are there edge cases not handled?
- Could this break existing features?

**Code Quality:**
- Is the code readable and maintainable?
- Does it follow project conventions?
- Are there unnecessary changes?

**Security:**
- Could this introduce security vulnerabilities?
- Are user inputs validated?
- Are secrets handled properly?

**Performance:**
- Could this impact performance negatively?
- Are database queries optimized?
- Is there unnecessary re-rendering (React)?

## Development Tips

**Useful commands:**

```bash
# Run development server
npm run dev

# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix

# Build for production (test locally)
npm run build
npm run start

# Test Gmail authentication
npm run test-gmail

# Test email parser
npm run test-parser
```

**Debugging:**

```typescript
// Add console.logs for debugging (remove before committing)
console.log('Debug info:', { variable1, variable2 });

// Use Vercel logs for production debugging
// Check: Vercel Dashboard → Deployments → Functions
```

**Database debugging:**

```sql
-- Check processing logs
SELECT * FROM haro_processing_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check failed email notifications
SELECT * FROM email_notifications
WHERE status = 'failed'
ORDER BY created_at DESC;
```

## Questions?

- **General questions:** Open a [GitHub Discussion](https://github.com/coloredsavage/HAROFilter/discussions)
- **Bug reports:** Open a [GitHub Issue](https://github.com/coloredsavage/HAROFilter/issues)
- **Security issues:** See [SECURITY.md](./SECURITY.md)

---

Thank you for contributing to HAROFilter!
