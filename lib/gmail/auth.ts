import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

/**
 * Generate OAuth2 authorization URL
 * @returns Authorization URL for user consent
 */
export function getAuthUrl(): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  });

  return authUrl;
}

/**
 * Exchange authorization code for tokens
 * @param code - Authorization code from OAuth callback
 * @returns OAuth2 tokens including refresh_token
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw new Error(`Failed to get tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Refresh access token using refresh token
 * @param auth - OAuth2Client with refresh_token set
 * @returns New access token
 */
export async function refreshAccessToken(auth: OAuth2Client): Promise<string> {
  try {
    const { credentials } = await auth.refreshAccessToken();
    return credentials.access_token || '';
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error(`Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify OAuth2 credentials are valid
 * @param auth - OAuth2Client to verify
 * @returns True if credentials are valid
 */
export async function verifyCredentials(auth: OAuth2Client): Promise<boolean> {
  try {
    const gmail = google.gmail({ version: 'v1', auth });
    await gmail.users.getProfile({ userId: 'me' });
    return true;
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return false;
  }
}
