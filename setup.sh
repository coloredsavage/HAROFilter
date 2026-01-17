#!/bin/bash

# HAROFilter Setup Script
# This script helps you set up HAROFilter for local development

set -e  # Exit on error

echo "🎯 HAROFilter Setup Script"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists. Skipping creation."
    echo "   If you want to recreate it, delete .env.local and run this script again."
else
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and fill in your credentials:"
    echo "   - Supabase URL and Anon Key"
    echo "   - Google OAuth Client ID and Secret"
    echo "   - Gmail credentials"
    echo "   - Generate CRON_SECRET with: openssl rand -base64 32"
fi

echo ""
echo "=========================="
echo "📋 Next Steps:"
echo "=========================="
echo ""
echo "1. Edit .env.local with your credentials"
echo "   Open the file and replace all placeholder values"
echo ""
echo "2. Set up your Supabase database:"
echo "   - Go to Supabase Dashboard → SQL Editor"
echo "   - Run scripts/003-add-email-columns.sql"
echo ""
echo "3. Configure Gmail OAuth:"
echo "   npm run gmail-auth"
echo ""
echo "4. Start the development server:"
echo "   npm run dev"
echo ""
echo "5. Visit http://localhost:3000"
echo ""
echo "For detailed setup instructions, see README.md"
echo "For deployment guide, see DEPLOYMENT.md"
echo ""
echo "🎉 Setup complete! Happy coding!"
