# HAROFilter 🎯

<div align="center">

![HAROFilter Logo](https://img.shields.io/badge/HARO-Filter-blue?style=for-the-badge)

**Never miss a HARO opportunity again.**

HAROFilter automatically monitors HARO (Help A Reporter Out) emails, matches queries to your keywords, and sends instant notifications when relevant opportunities appear.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/coloredsavage/HAROFilter)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ Features

- 🔍 **Smart Keyword Matching** - Set your expertise keywords and get matched with relevant HARO queries
- 📧 **Instant Notifications** - Receive email alerts when new matches are found
- 📊 **Dashboard** - View all matched queries in one place
- ⏰ **Daily Digest** - Optional daily summary of all matches
- 🔐 **Secure Authentication** - Email/password authentication with Supabase
- 🎨 **Beautiful UI** - Modern, responsive interface built with Next.js and Tailwind
- 💰 **100% Free** - Runs entirely on free tiers (Gmail API, Supabase, Vercel)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Gmail account (for receiving HARO emails and sending notifications)
- A Supabase account (free tier)
- A Vercel account (free tier)
- A cron-job.org account (free tier)

### Automated Setup (Recommended)

Run the setup script to automate initial configuration:

```bash
git clone https://github.com/coloredsavage/HAROFilter.git
cd HAROFilter/harofilter
./setup.sh
```

The script will:
- ✅ Check Node.js version (18+ required)
- ✅ Install dependencies
- ✅ Create `.env.local` from `.env.example`
- ✅ Guide you through next steps

### Manual Setup

If you prefer manual setup:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/coloredsavage/HAROFilter.git
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

   Fill in all required values in `.env.local` (see [Environment Variables](#environment-variables))

4. **Run database migrations:**
   - Go to your Supabase Dashboard → SQL Editor
   - Run the migrations in order:
     - `scripts/001-initial-schema.sql` (if not already run)
     - `scripts/002-*.sql` (any other migrations)
     - `scripts/003-add-email-columns.sql`

5. **Set up Gmail OAuth:**
   ```bash
   npm run gmail-auth
   ```

   Follow the instructions to authorize Gmail access and get your refresh token.

6. **Start the development server:**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see your application!

## 📋 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase (Get from: https://supabase.com/dashboard/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (Get from: https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URL=http://localhost:3000/api/gmail/auth

# Gmail OAuth Refresh Token (Get by running: npm run gmail-auth)
GMAIL_REFRESH_TOKEN=your_refresh_token

# Gmail SMTP (Get from: https://myaccount.google.com/apppasswords)
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password

# Cron Security (Generate with: openssl rand -base64 32)
CRON_SECRET=your_random_secret

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## 🏗️ Architecture

```
HARO Email (3x/day)
    ↓
Gmail Inbox (your-email@gmail.com)
    ↓
Cron Job (hourly) → Gmail API
    ↓
Email Parser → Extract Queries
    ↓
Supabase Database
    ↓
Keyword Matcher
    ↓
Email Notifications (SMTP)
    ↓
User Dashboard
```

### Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Email:** Gmail API + Nodemailer (Gmail SMTP)
- **Cron Jobs:** cron-job.org
- **Deployment:** Vercel

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [Cron Job Setup](./CRON-JOB-ORG-SETUP.md) - Setting up automated email polling
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Technical implementation details
- [Security Guide](./SECURITY.md) - Security best practices

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Gmail OAuth Setup
npm run gmail-auth   # Get Gmail refresh token

# Testing
npm run test-gmail   # Test Gmail API connection
npm run test-parser  # Test HARO email parser
```

## 🛠️ Development

### Project Structure

```
harofilter/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── cron/         # Cron job endpoints
│   │   └── gmail/        # Gmail OAuth callbacks
│   ├── dashboard/        # Dashboard pages
│   ├── login/            # Authentication pages
│   └── settings/         # User settings
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── email/            # Email parser and matcher
│   ├── gmail/            # Gmail API client
│   ├── mailer/           # Email notification system
│   └── services/         # Business logic services
├── scripts/              # Utility scripts
│   ├── 003-*.sql        # Database migrations
│   ├── gmail-auth.ts    # OAuth setup script
│   └── test-*.ts        # Testing scripts
└── types/                # TypeScript type definitions
```

### Adding New Features

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally
4. Submit a pull request

## 🔒 Security

- **Environment Variables:** Never commit `.env.local` or `.env.production` files
- **OAuth Credentials:** Keep your Google OAuth credentials private
- **Cron Secret:** Use a strong random string for `CRON_SECRET`
- **Database Access:** Use Supabase Row Level Security (RLS) policies

See [SECURITY.md](./SECURITY.md) for detailed security practices.

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) first.

## 💬 Support

- **Issues:** [GitHub Issues](https://github.com/coloredsavage/HAROFilter/issues)
- **Discussions:** [GitHub Discussions](https://github.com/coloredsavage/HAROFilter/discussions)

## 🙏 Acknowledgments

- [HARO](https://www.helpareporter.com/) - Help A Reporter Out
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Vercel](https://vercel.com/) - Deployment platform
- [shadcn/ui](https://ui.shadcn.com/) - UI component library

---

**Built with ❤️ by the HAROFilter team**
