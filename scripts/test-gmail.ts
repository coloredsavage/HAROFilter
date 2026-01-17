/**
 * Test script for Gmail API integration
 * Usage: npm run test-gmail
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { createGmailClient, fetchUnreadHaroEmails, extractEmailBody, extractEmailSubject, extractReceivedDate } from '../lib/gmail/client';
import { verifyCredentials } from '../lib/gmail/auth';

async function main() {
  console.log('🧪 Testing Gmail API Integration\n');

  // Check if environment variables are set
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
    console.error('❌ Missing required environment variables:');
    console.error('   - GOOGLE_CLIENT_ID');
    console.error('   - GOOGLE_CLIENT_SECRET');
    console.error('   - GMAIL_REFRESH_TOKEN');
    console.error('\nPlease run: npm run gmail-auth first to get these credentials.');
    process.exit(1);
  }

  console.log('✅ Environment variables found\n');

  // Step 1: Create Gmail client
  console.log('Step 1: Initialize Gmail client...');
  const auth = createGmailClient();
  console.log('✅ Gmail client initialized\n');

  // Step 2: Verify credentials
  console.log('Step 2: Verify OAuth credentials...');
  const isValid = await verifyCredentials(auth);

  if (!isValid) {
    console.error('❌ Invalid credentials!');
    console.error('   Your refresh token might be expired or invalid.');
    console.error('   Please run: npm run gmail-auth to get a new token.');
    process.exit(1);
  }

  console.log('✅ Credentials verified\n');

  // Step 3: Fetch unread HARO emails
  console.log('Step 3: Fetch unread HARO emails...');

  try {
    const emails = await fetchUnreadHaroEmails(auth);

    console.log(`✅ Found ${emails.length} unread HARO email(s)\n`);

    if (emails.length === 0) {
      console.log('ℹ️  No unread HARO emails found.');
      console.log('   If you have unread HARO emails, check:');
      console.log('   1. The GMAIL_USER matches the account you authorized');
      console.log('   2. Emails are from: press@harorequest.com');
      console.log('   3. Emails are marked as unread');
    } else {
      console.log('=' .repeat(60));
      console.log('📧 Email Details:\n');

      for (let i = 0; i < Math.min(emails.length, 3); i++) {
        const email = emails[i];
        const subject = extractEmailSubject(email);
        const receivedAt = extractReceivedDate(email);
        const body = extractEmailBody(email);

        console.log(`Email ${i + 1}:`);
        console.log(`  ID: ${email.id}`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Received: ${receivedAt.toLocaleString()}`);
        console.log(`  Body Length: ${body.length} characters`);
        console.log('');
      }

      if (emails.length > 3) {
        console.log(`... and ${emails.length - 3} more email(s)`);
      }

      console.log('=' .repeat(60));
    }

    console.log('\n✅ All tests passed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the parser: npm run test-parser');
    console.log('2. Start the dev server: npm run dev');
    console.log('3. Manually trigger polling: POST http://localhost:3000/api/cron/poll-gmail');
  } catch (error) {
    console.error('\n❌ Error fetching emails:', error);
    console.error('');
    console.error('Possible causes:');
    console.error('1. Invalid refresh token - run: npm run gmail-auth');
    console.error('2. Gmail API not enabled in Google Cloud Console');
    console.error('3. Network/firewall issues');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
