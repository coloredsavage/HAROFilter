#!/usr/bin/env tsx

/**
 * Script to process forwarded HARO emails with .eml attachments
 * Run: npm run process-forwarded
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

async function processForwardedEmails() {
  console.log('🔄 Processing forwarded HARO emails...');

  // Check if CRON_SECRET is available
  if (!process.env.CRON_SECRET) {
    console.error('❌ Missing CRON_SECRET environment variable');
    console.error('Please ensure CRON_SECRET is set in your .env.local file');
    process.exit(1);
  }

  try {
    const response = await fetch('http://localhost:3000/api/process-forwarded', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Processing complete!');
      console.log(`📧 Emails processed: ${data.emailsProcessed}`);
      console.log(`📎 Attachments processed: ${data.attachmentsProcessed}`);
      console.log(`📝 Queries extracted: ${data.queriesExtracted}`);
      console.log(`👥 Users notified: ${data.usersNotified}`);
      console.log(`⚠️  Errors: ${data.errors}`);
      console.log(`⏱️  Processing time: ${data.processingTimeMs}ms`);
    } else {
      console.error('❌ Processing failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
processForwardedEmails().catch(console.error);