import { getSupabaseServerClient } from '@/lib/supabase/server';
import { parseHaroEmail } from '@/lib/email/parser';
import { matchQueryToKeywords, createUserQueryRecords } from '@/lib/email/matcher';
import { sendNewMatchNotifications } from '@/lib/services/notification-service';
import { ParsedEmail, ProcessingStats, KeywordMatch } from '@/types/haro';

/**
 * Process a HARO email: parse, store queries, match keywords, send notifications
 * @param emailBody - Full email body
 * @param emailId - Gmail message ID
 * @param emailSubject - Email subject line
 * @param receivedAt - When the email was received
 * @returns Processing statistics
 */
export async function processHaroEmail(
  emailBody: string,
  emailId: string,
  emailSubject: string,
  receivedAt: Date
): Promise<ProcessingStats> {
  const startTime = Date.now();
  const stats: ProcessingStats = {
    emailsProcessed: 1,
    queriesExtracted: 0,
    usersNotified: 0,
    errors: 0,
    processingTimeMs: 0,
  };

  const supabase = await getSupabaseServerClient();

  try {
    // Step 1: Log processing start
    await logProcessing(emailId, 'received', 0, 0);

    // Step 2: Parse email
    const parsedEmail: ParsedEmail = parseHaroEmail(
      emailBody,
      emailId,
      emailSubject,
      receivedAt
    );

    if (parsedEmail.parseErrors.length > 0) {
      console.warn(`Parse errors for ${emailId}:`, parsedEmail.parseErrors);
    }

    if (parsedEmail.queries.length === 0) {
      await logProcessing(
        emailId,
        'failed',
        0,
        0,
        'No queries extracted from email'
      );
      stats.errors = 1;
      stats.processingTimeMs = Date.now() - startTime;
      return stats;
    }

    stats.queriesExtracted = parsedEmail.queries.length;
    await logProcessing(emailId, 'parsed', parsedEmail.queries.length, 0);

    // Step 3: Insert queries into database
    const insertedQueries = await insertQueries(parsedEmail);

    if (insertedQueries.length === 0) {
      await logProcessing(emailId, 'failed', 0, 0, 'Failed to insert queries');
      stats.errors = 1;
      stats.processingTimeMs = Date.now() - startTime;
      return stats;
    }

    await logProcessing(emailId, 'stored', insertedQueries.length, 0);

    // Step 4: Match queries to user keywords
    const allMatches: KeywordMatch[] = [];

    for (const query of parsedEmail.queries) {
      const matches = await matchQueryToKeywords(query);

      // Find the corresponding inserted query to get its ID
      const insertedQuery = insertedQueries.find(
        (q) => q.headline === query.headline
      );

      if (insertedQuery) {
        // Add query ID to matches
        matches.forEach((match) => {
          match.queryId = insertedQuery.id;
        });

        allMatches.push(...matches);
      }
    }

    if (allMatches.length === 0) {
      console.log(`No keyword matches found for email ${emailId}`);
      await logProcessing(emailId, 'matched', insertedQueries.length, 0);
      stats.processingTimeMs = Date.now() - startTime;
      return stats;
    }

    // Step 5: Create user_queries records
    await createUserQueryRecords(allMatches);
    await logProcessing(emailId, 'matched', insertedQueries.length, allMatches.length);

    // Step 6: Send email notifications
    const notificationsSent = await sendNewMatchNotifications(allMatches);
    stats.usersNotified = notificationsSent;

    await logProcessing(
      emailId,
      'notified',
      insertedQueries.length,
      notificationsSent
    );

    stats.processingTimeMs = Date.now() - startTime;
    return stats;
  } catch (error) {
    console.error(`Error processing email ${emailId}:`, error);
    await logProcessing(
      emailId,
      'failed',
      stats.queriesExtracted,
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
    stats.errors = 1;
    stats.processingTimeMs = Date.now() - startTime;
    return stats;
  }
}

/**
 * Insert parsed queries into database
 */
async function insertQueries(parsedEmail: ParsedEmail) {
  const supabase = await getSupabaseServerClient();

  try {
    // Prepare query records
    const queryRecords = parsedEmail.queries.map((query) => ({
      headline: query.headline,
      full_text: query.fullText,
      requirements: query.requirements,
      deadline: query.deadline.toISOString(),
      journalist_email: query.journalistEmail,
      publication: query.publication,
      category: query.category,
      haro_email_id: query.haroEmailId,
      haro_category: parsedEmail.category,
      source_email_received_at: parsedEmail.receivedAt.toISOString(),
    }));

    // Batch insert queries
    const { data, error } = await supabase
      .from('queries')
      .insert(queryRecords)
      .select('id, headline');

    if (error) {
      console.error('Error inserting queries:', error);
      throw error;
    }

    console.log(`Inserted ${data?.length || 0} queries for email ${parsedEmail.emailId}`);
    return data || [];
  } catch (error) {
    console.error('Error in insertQueries:', error);
    throw error;
  }
}

/**
 * Log processing status to haro_processing_logs table
 */
async function logProcessing(
  emailId: string,
  status: 'received' | 'parsed' | 'stored' | 'matched' | 'notified' | 'failed',
  queriesExtracted: number,
  usersNotified: number,
  errorMessage?: string
) {
  const supabase = await getSupabaseServerClient();

  try {
    await supabase.from('haro_processing_logs').insert({
      email_id: emailId,
      status,
      queries_extracted: queriesExtracted,
      users_notified: usersNotified,
      error_message: errorMessage,
      processing_time_ms: 0, // Will be updated at the end
    });
  } catch (error) {
    console.error('Error logging processing status:', error);
    // Don't throw - logging should not fail the main process
  }
}

/**
 * Check if email has already been processed
 */
export async function isEmailProcessed(emailId: string): Promise<boolean> {
  const supabase = await getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('queries')
      .select('id')
      .eq('haro_email_id', emailId)
      .limit(1);

    if (error) {
      console.error('Error checking if email is processed:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error in isEmailProcessed:', error);
    return false;
  }
}
