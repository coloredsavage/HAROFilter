import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { processHaroEmail, isEmailProcessed } from '@/lib/services/query-processor';
import { ProcessingStats } from '@/types/haro';

/**
 * Process forwarded HARO emails with .eml attachments
 * GET/POST: /api/process-forwarded
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting forwarded email processing...');

    // Create Gmail client
    const auth = createGmailClient();

    // Fetch emails with .eml attachments
    const emails = await fetchEmailsWithEmlAttachments(auth);

    if (emails.length === 0) {
      console.log('✅ No emails with .eml attachments found');
      return NextResponse.json({
        success: true,
        message: 'No forwarded emails to process',
        emailsProcessed: 0,
        processingTimeMs: Date.now() - startTime,
      });
    }

    console.log(`📬 Found ${emails.length} email(s) with .eml attachments`);

    // Process each email's attachments
    const allStats: ProcessingStats[] = [];
    let totalAttachmentsProcessed = 0;

    for (const email of emails) {
      try {
        const attachments = await extractEmlAttachments(auth, email.id!);

        for (const attachment of attachments) {
          try {
            console.log(`📎 Processing attachment: ${attachment.filename}`);

            // Parse .eml content
            const emlContent = parseEmlFile(attachment.data);

            // Generate unique ID for this attachment
            const attachmentId = `${email.id}_${attachment.filename}_${Date.now()}`;

            // Check if already processed
            const alreadyProcessed = await isEmailProcessed(attachmentId);
            if (alreadyProcessed) {
              console.log(`⏭️  Attachment ${attachment.filename} already processed, skipping`);
              continue;
            }

            // Process through existing HARO pipeline
            const stats = await processHaroEmail(
              emlContent.body,
              attachmentId,
              emlContent.subject,
              emlContent.date
            );

            allStats.push(stats);
            totalAttachmentsProcessed++;

            console.log(`✅ Processed attachment ${attachment.filename}: ${stats.queriesExtracted} queries, ${stats.usersNotified} notifications`);
          } catch (error) {
            console.error(`❌ Error processing attachment ${attachment.filename}:`, error);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing email ${email.id}:`, error);
      }
    }

    // Calculate summary statistics
    const totalQueriesExtracted = allStats.reduce((sum, stat) => sum + stat.queriesExtracted, 0);
    const totalUsersNotified = allStats.reduce((sum, stat) => sum + stat.usersNotified, 0);
    const totalErrors = allStats.reduce((sum, stat) => sum + stat.errors, 0);

    const summary = {
      success: true,
      emailsProcessed: emails.length,
      attachmentsProcessed: totalAttachmentsProcessed,
      queriesExtracted: totalQueriesExtracted,
      usersNotified: totalUsersNotified,
      errors: totalErrors,
      processingTimeMs: Date.now() - startTime,
    };

    console.log('📊 Forwarded email processing complete:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('❌ Forwarded email processing failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Allow POST requests for manual triggering
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

/**
 * Initialize Gmail API client for untttld@gmail.com
 */
function createGmailClient(): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  // Set refresh token for untttld@gmail.com
  if (process.env.GMAIL_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }

  return oauth2Client;
}

/**
 * Fetch emails that contain .eml attachments
 */
async function fetchEmailsWithEmlAttachments(auth: OAuth2Client) {
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    // Search for emails with .eml attachments
    const query = 'has:attachment filename:eml';

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50,
    });

    const messages = response.data.messages || [];

    // Fetch full message details
    const fullMessages = [];
    for (const message of messages) {
      if (message.id) {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });
        fullMessages.push(fullMessage.data);
      }
    }

    return fullMessages;
  } catch (error) {
    console.error('Error fetching emails with attachments:', error);
    throw new Error(`Failed to fetch emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract .eml attachments from a Gmail message
 */
async function extractEmlAttachments(auth: OAuth2Client, messageId: string) {
  const gmail = google.gmail({ version: 'v1', auth });
  const attachments = [];

  try {
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const parts = message.data.payload?.parts || [];

    for (const part of parts) {
      if (part.filename && part.filename.toLowerCase().endsWith('.eml') && part.body?.attachmentId) {
        const attachment = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: messageId,
          id: part.body.attachmentId,
        });

        if (attachment.data.data) {
          attachments.push({
            filename: part.filename,
            data: Buffer.from(attachment.data.data, 'base64').toString('utf-8'),
          });
        }
      }
    }

    return attachments;
  } catch (error) {
    console.error(`Error extracting attachments from ${messageId}:`, error);
    throw new Error(`Failed to extract attachments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse .eml file content to extract email data
 */
function parseEmlFile(emlContent: string): { subject: string; body: string; date: Date } {
  try {
    const lines = emlContent.split('\n');
    let subject = '';
    let body = '';
    let date = new Date();
    let inHeaders = true;
    let bodyLines: string[] = [];

    for (const line of lines) {
      if (inHeaders) {
        if (line.trim() === '') {
          inHeaders = false;
          continue;
        }

        if (line.toLowerCase().startsWith('subject:')) {
          subject = line.substring(8).trim();
        } else if (line.toLowerCase().startsWith('date:')) {
          try {
            date = new Date(line.substring(5).trim());
          } catch {
            // Keep default date if parsing fails
          }
        }
      } else {
        bodyLines.push(line);
      }
    }

    body = bodyLines.join('\n');

    return {
      subject: subject || 'HARO Email',
      body: body.trim(),
      date,
    };
  } catch (error) {
    console.error('Error parsing .eml file:', error);
    throw new Error('Failed to parse .eml file content');
  }
}