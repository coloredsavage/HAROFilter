/**
 * Gmail OAuth 2.0 authentication script for DESKTOP app credentials
 * This version works with Desktop app OAuth credentials
 * Usage: npm run gmail-auth-desktop
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { google } from 'googleapis';
import * as readline from 'readline';

async function main() {
  console.log('🔐 Gmail OAuth 2.0 Authentication (Desktop App Flow)\n');

  // Check if environment variables are set
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ Missing required environment variables:');
    console.error('   - GOOGLE_CLIENT_ID');
    console.error('   - GOOGLE_CLIENT_SECRET');
    console.error('\nPlease set these in your .env.local file first.');
    process.exit(1);
  }

  console.log('✅ Environment variables found\n');

  // Create OAuth2 client for Desktop app (uses urn:ietf:wg:oauth:2.0:oob)
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob' // Special redirect URI for Desktop apps
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
  ];

  // Step 1: Generate authorization URL
  console.log('Step 1: Generate authorization URL');
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  console.log('\n📋 Please visit this URL to authorize the app:\n');
  console.log(authUrl);
  console.log('\n');
  console.log('After authorizing, Google will show you an authorization code.');
  console.log('Copy the code and paste it below.\n');

  // Step 2: Get authorization code from user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise<string>((resolve) => {
    rl.question('📝 Enter the authorization code: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!code) {
    console.error('❌ No authorization code provided');
    process.exit(1);
  }

  // Step 3: Exchange code for tokens
  console.log('\n🔄 Exchanging authorization code for tokens...\n');

  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('✅ Successfully obtained tokens!\n');
    console.log('=' .repeat(60));
    console.log('📋 IMPORTANT: Save these tokens to your .env.local file:');
    console.log('=' .repeat(60));
    console.log('');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('');
    console.log('=' .repeat(60));
    console.log('');

    if (!tokens.refresh_token) {
      console.warn('⚠️  WARNING: No refresh token received!');
      console.warn('   This might happen if you\'ve already authorized this app.');
      console.warn('   Try revoking access at: https://myaccount.google.com/permissions');
      console.warn('   Then run this script again.');
    } else {
      console.log('✅ Setup complete!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Copy the GMAIL_REFRESH_TOKEN line above');
      console.log('2. Add it to your .env.local file');
      console.log('3. Run: npm run test-gmail to verify everything works');
    }
  } catch (error) {
    console.error('\n❌ Error obtaining tokens:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
