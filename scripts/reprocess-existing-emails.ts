#!/usr/bin/env tsx

/**
 * Script to reprocess existing .eml attachments from Gmail with improved parser
 * This will update "Brief query" entries with full content
 * Run: npx tsx scripts/reprocess-existing-emails.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { parseHaroEmail } from '@/lib/email/parser';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

async function reprocessExistingEmails() {
  console.log('🔄 Reprocessing existing .eml files with improved parser...\n');

  // Check environment
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GMAIL_REFRESH_TOKEN) {
    console.error('❌ Missing Gmail configuration in .env.local');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase configuration in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create Supabase client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const auth = createGmailClient();

  try {
    // Fetch emails with .eml attachments
    console.log('📬 Fetching emails with .eml attachments from Gmail...');
    const emails = await fetchEmailsWithEmlAttachments(auth);

    if (emails.length === 0) {
      console.log('✅ No emails with .eml attachments found');
      return;
    }

    console.log(`📧 Found ${emails.length} emails with .eml attachments\n`);

    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process each email's attachments
    for (const [emailIndex, email] of emails.entries()) {
      console.log(`\n📧 Processing email ${emailIndex + 1}/${emails.length}...`);

      try {
        const attachments = await extractEmlAttachments(auth, email.id!);

        for (const [attIndex, attachment] of attachments.entries()) {
          console.log(`\n📎 Processing attachment ${attIndex + 1}/${attachments.length}: ${attachment.filename}`);

          try {
            // Parse .eml content
            const emlContent = parseEmlFile(attachment.data);
            console.log(`📄 Subject: "${emlContent.subject.substring(0, 80)}..."`);

            // Generate unique ID (same as original processing)
            const attachmentId = `${email.id}_${attachment.filename}`;

            // Check if this attachment was processed before
            const { data: existingEmails, error: fetchError } = await supabase
              .from('haro_processing_logs')
              .select('*')
              .ilike('email_id', `%${email.id}%`)
              .limit(1);

            if (fetchError) {
              console.error('❌ Error checking processing logs:', fetchError);
              continue;
            }

            if (!existingEmails || existingEmails.length === 0) {
              console.log('⏭️  No processing log found, skipping...');
              totalSkipped++;
              continue;
            }

            // Parse with improved parser
            const parsedResult = parseHaroEmail(
              emlContent.body,
              attachmentId,
              emlContent.subject,
              emlContent.date
            );

            console.log(`🔍 Parser found ${parsedResult.queries.length} queries`);

            if (parsedResult.queries.length === 0) {
              console.log('⚠️  No queries found, skipping...');
              totalSkipped++;
              continue;
            }

            // Update existing queries in database
            let queriesUpdated = 0;
            for (const query of parsedResult.queries) {
              // Find existing query by headline and email ID pattern
              const { data: existingQueries, error: queryFetchError } = await supabase
                .from('queries')
                .select('id, headline, full_text, requirements')
                .eq('headline', query.headline)
                .order('created_at', { ascending: false })
                .limit(5); // Get recent ones

              if (queryFetchError) {
                console.error('❌ Error fetching existing queries:', queryFetchError);
                continue;
              }

              if (!existingQueries || existingQueries.length === 0) {
                console.log(`⚠️  No existing query found for: "${query.headline.substring(0, 50)}..."`);
                continue;
              }

              // Find the query that needs updating (one with "Brief query" or short content)
              const queryToUpdate = existingQueries.find(q =>
                q.full_text?.includes('Brief query') ||
                (q.full_text?.length || 0) < 100
              );

              if (!queryToUpdate) {
                console.log(`✅ Query already has full content: "${query.headline.substring(0, 50)}..."`);
                continue;
              }

              // Update with full content
              const { error: updateError } = await supabase
                .from('queries')
                .update({
                  full_text: query.fullText,
                  requirements: query.requirements,
                  reporter_name: query.reporterName,
                  outlet_url: query.outletUrl,
                  haro_query_number: query.haroQueryNumber,
                  special_flags: query.specialFlags,
                  is_direct_email: query.isDirectEmail,
                  has_ai_detection: query.hasAiDetection,
                  trigger_words: query.triggerWords,
                  decoded_instructions: query.decodedInstructions,
                  extracted_urls: query.extractedUrls,
                  haro_article_url: query.haroArticleUrl,
                })
                .eq('id', queryToUpdate.id);

              if (updateError) {
                console.error(`❌ Error updating query ${queryToUpdate.id}:`, updateError);
                totalErrors++;
                continue;
              }

              console.log(`✅ Updated query: "${query.headline.substring(0, 50)}..." (${query.fullText.length} chars)`);
              queriesUpdated++;
            }

            if (queriesUpdated > 0) {
              totalUpdated += queriesUpdated;
              console.log(`🎉 Updated ${queriesUpdated} queries from ${attachment.filename}`);
            } else {
              console.log(`⏭️  No queries needed updating from ${attachment.filename}`);
              totalSkipped++;
            }

          } catch (error) {
            console.error(`❌ Error processing attachment ${attachment.filename}:`, error);
            totalErrors++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing email ${email.id}:`, error);
        totalErrors++;
      }
    }

    console.log(`\n🎉 Reprocessing complete!`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ Queries updated: ${totalUpdated}`);
    console.log(`   ⏭️  Queries skipped: ${totalSkipped}`);
    console.log(`   ❌ Errors: ${totalErrors}`);

    if (totalUpdated > 0) {
      console.log(`\n🚀 ${totalUpdated} queries now have full content instead of "Brief query"!`);
      console.log(`💡 Refresh your dashboard to see the improvements.`);
    }

  } catch (error) {
    console.error('❌ Reprocessing failed:', error);
    process.exit(1);
  }
}

function createGmailClient(): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  if (process.env.GMAIL_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }

  return oauth2Client;
}

async function fetchEmailsWithEmlAttachments(auth: OAuth2Client) {
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const query = 'has:attachment filename:eml';
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20, // Limit to recent emails
    });

    const messages = response.data.messages || [];
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
    console.error('Error fetching emails:', error);
    throw new Error(`Failed to fetch emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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

function parseEmlFile(emlContent: string): { subject: string; body: string; date: Date } {
  try {
    const lines = emlContent.split('\n');
    let subject = '';
    let body = '';
    let date = new Date();
    let inHeaders = true;
    let bodyLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (inHeaders) {
        if (line.trim() === '') {
          inHeaders = false;
          continue;
        }

        if (line.startsWith(' ') || line.startsWith('\t')) {
          continue;
        }

        if (line.toLowerCase().startsWith('subject:')) {
          subject = line.substring(8).trim();
          subject = subject.replace(/=\?[^?]+\?[BQ]\?([^?]+)\?=/gi, '$1');
        } else if (line.toLowerCase().startsWith('date:')) {
          try {
            date = new Date(line.substring(5).trim());
          } catch {
            // Use current date if parsing fails
          }
        }
      } else {
        bodyLines.push(line);
      }
    }

    body = bodyLines.join('\n').trim();

    // Clean up body
    body = body
      .replace(/Content-Type:[^\r\n]*/gi, '')
      .replace(/Content-Transfer-Encoding:[^\r\n]*/gi, '')
      .replace(/^--[^\r\n]*$/gm, '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      subject: subject || 'HARO Email',
      body: body || emlContent,
      date: isNaN(date.getTime()) ? new Date() : date,
    };
  } catch (error) {
    console.error('Error parsing .eml file:', error);
    throw new Error(`Failed to parse .eml file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Run the script
reprocessExistingEmails().catch(console.error);