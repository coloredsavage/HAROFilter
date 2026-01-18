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
    const debugLogs: string[] = [];

    for (const email of emails) {
      try {
        const attachments = await extractEmlAttachments(auth, email.id!);

        for (const attachment of attachments) {
          try {
            console.log(`📎 Processing attachment: ${attachment.filename}`);

            // Parse .eml content
            const emlContent = parseEmlFile(attachment.data);

            console.log(`📄 EML parsed - Subject: "${emlContent.subject.substring(0, 100)}..."`);
            console.log(`📄 Body length: ${emlContent.body.length} chars`);
            console.log(`📄 First 200 chars: "${emlContent.body.substring(0, 200).replace(/\n/g, '\\n')}..."`);

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

            console.log(`📊 Processing stats for ${attachment.filename}: queries=${stats.queriesExtracted}, errors=${stats.errors}`);

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
 * Initialize Gmail API client
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
    console.log(`🔍 Parsing EML file - total length: ${emlContent.length} chars`);

    const lines = emlContent.split('\n');
    let subject = '';
    let body = '';
    let date = new Date();
    let inHeaders = true;
    let bodyLines: string[] = [];
    let contentType = '';
    let isMultipart = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (inHeaders) {
        if (line.trim() === '') {
          inHeaders = false;
          console.log(`📧 Headers parsed - Subject: "${subject}", Content-Type: "${contentType}"`);
          continue;
        }

        // Handle multi-line headers (continuation lines start with space or tab)
        if (line.startsWith(' ') || line.startsWith('\t')) {
          continue; // Skip continuation lines for now
        }

        if (line.toLowerCase().startsWith('subject:')) {
          subject = line.substring(8).trim();
          // Remove any encoding artifacts like =?UTF-8?Q?...?=
          subject = subject.replace(/=\?[^?]+\?[BQ]\?([^?]+)\?=/gi, '$1');
        } else if (line.toLowerCase().startsWith('date:')) {
          try {
            date = new Date(line.substring(5).trim());
          } catch {
            console.warn(`⚠️  Failed to parse date: ${line.substring(5).trim()}`);
          }
        } else if (line.toLowerCase().startsWith('content-type:')) {
          contentType = line.substring(13).trim();
          isMultipart = contentType.toLowerCase().includes('multipart');
        }
      } else {
        // In body section
        if (isMultipart && line.startsWith('--')) {
          // Skip multipart boundaries for now - we'll take all content
          continue;
        }
        bodyLines.push(line);
      }
    }

    body = bodyLines.join('\n').trim();

    // Clean up body - remove common email artifacts
    body = body
      .replace(/Content-Type:[^\r\n]*/gi, '') // Remove Content-Type lines
      .replace(/Content-Transfer-Encoding:[^\r\n]*/gi, '') // Remove encoding lines
      .replace(/^--[^\r\n]*$/gm, '') // Remove boundary lines
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
      .trim();

    // Decode quoted-printable encoding
    body = decodeQuotedPrintable(body);

    console.log(`✅ EML parsing complete - Subject: "${subject.substring(0, 50)}...", Body: ${body.length} chars`);
    console.log(`🔍 Decoded content preview: "${body.substring(0, 300).replace(/\n/g, '\\n')}..."`);

    // If body is still mostly encoded or empty, try to extract from raw content
    if (body.length < 1000 || body.includes('=') && body.length < emlContent.length / 2) {
      console.log('⚠️  Body seems incomplete, trying raw content extraction...');
      body = emlContent; // Use raw content as fallback
    }

    return {
      subject: subject || 'HARO Email',
      body: body || emlContent, // Fallback to raw content if parsing fails
      date: isNaN(date.getTime()) ? new Date() : date,
    };
  } catch (error) {
    console.error('Error parsing .eml file:', error);
    console.error('EML content preview:', emlContent.substring(0, 500));
    throw new Error(`Failed to parse .eml file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decode quoted-printable encoded text
 */
function decodeQuotedPrintable(text: string): string {
  try {
    return text
      // Handle soft line breaks (= at end of line)
      .replace(/=\r?\n/g, '')
      // Decode hex sequences (=XX)
      .replace(/=([0-9A-F]{2})/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      })
      // Clean up any remaining artifacts
      .replace(/=$/gm, ''); // Remove trailing = that didn't get processed
  } catch (error) {
    console.warn('Error decoding quoted-printable:', error);
    return text; // Return original if decoding fails
  }
}