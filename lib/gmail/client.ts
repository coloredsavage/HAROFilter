import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GmailMessage } from '@/types/haro';

/**
 * Initialize Gmail API client with OAuth2 credentials
 */
export function createGmailClient(): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  // Set refresh token if available
  if (process.env.GMAIL_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }

  return oauth2Client;
}

/**
 * Fetch unread HARO emails from Gmail
 * @param auth - OAuth2Client with valid credentials
 * @returns Array of Gmail messages
 */
export async function fetchUnreadHaroEmails(
  auth: OAuth2Client
): Promise<GmailMessage[]> {
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    // Search for unread emails from HARO
    const query = 'from:press@harorequest.com is:unread';

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50,
    });

    const messages = response.data.messages || [];

    // Fetch full message details for each email
    const fullMessages: GmailMessage[] = [];

    for (const message of messages) {
      if (message.id) {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });

        fullMessages.push(fullMessage.data as GmailMessage);
      }
    }

    return fullMessages;
  } catch (error) {
    console.error('Error fetching HARO emails:', error);
    throw new Error(`Failed to fetch emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Mark email as read in Gmail
 * @param auth - OAuth2Client with valid credentials
 * @param messageId - Gmail message ID
 */
export async function markEmailAsRead(
  auth: OAuth2Client,
  messageId: string
): Promise<void> {
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  } catch (error) {
    console.error(`Error marking email ${messageId} as read:`, error);
    throw new Error(`Failed to mark email as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract email body from Gmail message
 * @param message - Gmail message object
 * @returns Decoded email body as string
 */
export function extractEmailBody(message: GmailMessage): string {
  const { payload } = message;

  // Try to get HTML body first (most HARO emails are HTML)
  let body = '';

  if (payload.parts) {
    // Multipart message
    const htmlPart = payload.parts.find((part) => part.mimeType === 'text/html');
    const textPart = payload.parts.find((part) => part.mimeType === 'text/plain');

    if (htmlPart && htmlPart.body?.data) {
      body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
    } else if (textPart && textPart.body?.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }
  } else if (payload.body?.data) {
    // Simple message body
    body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  return body;
}

/**
 * Extract email subject from Gmail message
 * @param message - Gmail message object
 * @returns Email subject
 */
export function extractEmailSubject(message: GmailMessage): string {
  const subjectHeader = message.payload.headers.find(
    (header) => header.name.toLowerCase() === 'subject'
  );
  return subjectHeader?.value || '';
}

/**
 * Extract received date from Gmail message
 * @param message - Gmail message object
 * @returns Date object
 */
export function extractReceivedDate(message: GmailMessage): Date {
  const timestamp = parseInt(message.internalDate);
  return new Date(timestamp);
}

/**
 * Batch mark multiple emails as read
 * @param auth - OAuth2Client with valid credentials
 * @param messageIds - Array of Gmail message IDs
 */
export async function markEmailsAsRead(
  auth: OAuth2Client,
  messageIds: string[]
): Promise<void> {
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: messageIds,
        removeLabelIds: ['UNREAD'],
      },
    });
  } catch (error) {
    console.error('Error batch marking emails as read:', error);
    throw new Error(`Failed to mark emails as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
