#!/usr/bin/env tsx

/**
 * Script to fix "Brief query" entries by directly updating them in the database
 * This approach finds queries with brief content and updates them with full content
 * Run: npx tsx scripts/fix-brief-queries.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { parseHaroEmail } from '@/lib/email/parser';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

async function fixBriefQueries() {
  console.log('🔄 Finding and fixing "Brief query" entries...\n');

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

  try {
    // Step 1: Find all queries with "Brief query" or short content
    console.log('🔍 Step 1: Finding queries that need updating...');

    const { data: briefQueries, error: fetchError } = await supabase
      .from('queries')
      .select('id, headline, full_text, requirements, created_at')
      .or('full_text.ilike.%Brief query%,requirements.ilike.%Brief query%')
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error('❌ Error fetching queries:', fetchError);
      process.exit(1);
    }

    if (!briefQueries || briefQueries.length === 0) {
      console.log('✅ No queries with "Brief query" found! All queries already have full content.');
      return;
    }

    console.log(`📋 Found ${briefQueries.length} queries with brief content:`);
    briefQueries.forEach((q, i) => {
      console.log(`   ${i + 1}. "${q.headline.substring(0, 50)}..." (${q.full_text?.length || 0} chars)`);
    });

    // Step 2: Get fresh .eml files from Gmail
    console.log('\n📬 Step 2: Fetching recent .eml files from Gmail...');
    const auth = createGmailClient();
    const emails = await fetchEmailsWithEmlAttachments(auth);

    if (emails.length === 0) {
      console.log('❌ No .eml files found in Gmail');
      return;
    }

    console.log(`📧 Found ${emails.length} emails with .eml attachments`);

    // Step 3: Parse all .eml files and create a lookup map
    console.log('\n🔍 Step 3: Parsing all .eml files...');
    const allParsedQueries = new Map(); // headline -> parsed query

    for (const [emailIndex, email] of emails.entries()) {
      console.log(`   📧 Processing email ${emailIndex + 1}/${emails.length}...`);

      try {
        const attachments = await extractEmlAttachments(auth, email.id!);

        for (const attachment of attachments) {
          try {
            // Parse .eml content
            const emlContent = parseEmlFile(attachment.data);

            // Parse with improved parser
            const parsedResult = parseHaroEmail(
              emlContent.body,
              `${email.id}_${attachment.filename}`,
              emlContent.subject,
              emlContent.date
            );

            // Add all queries to lookup map
            parsedResult.queries.forEach(query => {
              const key = query.headline.toLowerCase().trim();
              allParsedQueries.set(key, query);
            });

          } catch (error) {
            console.error(`❌ Error parsing ${attachment.filename}:`, error);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing email ${email.id}:`, error);
      }
    }

    console.log(`📚 Parsed ${allParsedQueries.size} unique queries from .eml files`);

    // Step 4: Match and update brief queries
    console.log('\n✅ Step 4: Updating brief queries with full content...');

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const briefQuery of briefQueries) {
      const searchKey = briefQuery.headline.toLowerCase().trim();
      const fullQuery = allParsedQueries.get(searchKey);

      if (!fullQuery) {
        console.log(`⚠️  No match found for: "${briefQuery.headline.substring(0, 50)}..."`);
        notFoundCount++;
        continue;
      }

      // Check if it actually needs updating
      if (fullQuery.fullText.length <= (briefQuery.full_text?.length || 0)) {
        console.log(`⏭️  Query already has full content: "${briefQuery.headline.substring(0, 50)}..."`);
        continue;
      }

      // Update with full content
      const { error: updateError } = await supabase
        .from('queries')
        .update({
          full_text: fullQuery.fullText,
          requirements: fullQuery.requirements,
          reporter_name: fullQuery.reporterName,
          outlet_url: fullQuery.outletUrl,
          haro_query_number: fullQuery.haroQueryNumber,
          special_flags: fullQuery.specialFlags,
          is_direct_email: fullQuery.isDirectEmail,
          has_ai_detection: fullQuery.hasAiDetection,
          trigger_words: fullQuery.triggerWords,
          decoded_instructions: fullQuery.decodedInstructions,
          extracted_urls: fullQuery.extractedUrls,
          haro_article_url: fullQuery.haroArticleUrl,
        })
        .eq('id', briefQuery.id);

      if (updateError) {
        console.error(`❌ Error updating query ${briefQuery.id}:`, updateError);
        continue;
      }

      console.log(`✅ Updated: "${briefQuery.headline.substring(0, 50)}..." (${briefQuery.full_text?.length || 0} → ${fullQuery.fullText.length} chars)`);
      updatedCount++;
    }

    console.log(`\n🎉 Brief query fix complete!`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ Queries updated: ${updatedCount}`);
    console.log(`   ⚠️  Queries not found: ${notFoundCount}`);

    if (updatedCount > 0) {
      console.log(`\n🚀 ${updatedCount} queries now have full content instead of "Brief query"!`);
      console.log(`💡 Refresh your dashboard to see the improvements.`);
    } else {
      console.log(`\n💡 No queries needed updating. All might already have full content.`);
    }

  } catch (error) {
    console.error('❌ Brief query fix failed:', error);
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
      maxResults: 10, // Limit to recent emails
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
fixBriefQueries().catch(console.error);