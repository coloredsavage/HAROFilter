import { NextRequest, NextResponse } from 'next/server';
import { createGmailClient, fetchUnreadHaroEmails, extractEmailBody, extractEmailSubject, extractReceivedDate, markEmailsAsRead } from '@/lib/gmail/client';
import { processHaroEmail, isEmailProcessed } from '@/lib/services/query-processor';
import { ProcessingStats } from '@/types/haro';

/**
 * Gmail polling cron job
 * Runs every hour to fetch and process new HARO emails
 *
 * Vercel Cron: /api/cron/poll-gmail
 * Schedule: 0 * * * * (every hour)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting Gmail polling cron job...');

    // Step 1: Initialize Gmail client
    const auth = createGmailClient();

    // Step 2: Fetch unread HARO emails
    const emails = await fetchUnreadHaroEmails(auth);

    if (emails.length === 0) {
      console.log('✅ No new HARO emails found');
      return NextResponse.json({
        success: true,
        message: 'No new emails to process',
        emailsProcessed: 0,
        processingTimeMs: Date.now() - startTime,
      });
    }

    console.log(`📬 Found ${emails.length} unread HARO email(s)`);

    // Step 3: Process each email
    const allStats: ProcessingStats[] = [];
    const processedEmailIds: string[] = [];

    for (const email of emails) {
      try {
        const emailId = email.id;

        // Check if email has already been processed
        const alreadyProcessed = await isEmailProcessed(emailId);
        if (alreadyProcessed) {
          console.log(`⏭️  Email ${emailId} already processed, skipping`);
          processedEmailIds.push(emailId);
          continue;
        }

        // Extract email data
        const emailBody = extractEmailBody(email);
        const emailSubject = extractEmailSubject(email);
        const receivedAt = extractReceivedDate(email);

        console.log(`📧 Processing email: ${emailSubject}`);

        // Process the email
        const stats = await processHaroEmail(
          emailBody,
          emailId,
          emailSubject,
          receivedAt
        );

        allStats.push(stats);
        processedEmailIds.push(emailId);

        console.log(`✅ Processed email ${emailId}: ${stats.queriesExtracted} queries, ${stats.usersNotified} notifications`);
      } catch (error) {
        console.error(`❌ Error processing email ${email.id}:`, error);
        // Continue with next email even if one fails
      }
    }

    // Step 4: Mark processed emails as read
    if (processedEmailIds.length > 0) {
      try {
        await markEmailsAsRead(auth, processedEmailIds);
        console.log(`📑 Marked ${processedEmailIds.length} email(s) as read`);
      } catch (error) {
        console.error('Error marking emails as read:', error);
        // Don't fail the whole job if marking as read fails
      }
    }

    // Step 5: Calculate summary statistics
    const totalQueriesExtracted = allStats.reduce((sum, stat) => sum + stat.queriesExtracted, 0);
    const totalUsersNotified = allStats.reduce((sum, stat) => sum + stat.usersNotified, 0);
    const totalErrors = allStats.reduce((sum, stat) => sum + stat.errors, 0);

    const summary = {
      success: true,
      emailsProcessed: allStats.length,
      queriesExtracted: totalQueriesExtracted,
      usersNotified: totalUsersNotified,
      errors: totalErrors,
      processingTimeMs: Date.now() - startTime,
    };

    console.log('📊 Polling complete:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('❌ Cron job failed:', error);

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
 * Allow POST requests for manual triggering (development/testing)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
