import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/mailer/client';
import { generateNewMatchEmail } from '@/lib/mailer/templates/new-match';
import { generateDigestEmail } from '@/lib/mailer/templates/daily-digest';
import { KeywordMatch, NewMatchEmailData, DigestEmailData } from '@/types/haro';
import { isDeadlineUrgent } from '@/lib/email/parser';

/**
 * Send new match notifications to users
 * @param matches - Array of keyword matches
 * @returns Number of notifications sent successfully
 */
export async function sendNewMatchNotifications(
  matches: KeywordMatch[]
): Promise<number> {
  const supabase = await getSupabaseServerClient();
  let notificationsSent = 0;

  try {
    // Group matches by user
    const userMatches: Map<string, KeywordMatch[]> = new Map();

    for (const match of matches) {
      if (match.userNotificationEnabled) {
        if (!userMatches.has(match.userId)) {
          userMatches.set(match.userId, []);
        }
        userMatches.get(match.userId)!.push(match);
      }
    }

    // Send notification to each user
    for (const [userId, userMatchList] of userMatches.entries()) {
      try {
        // Get user email and name
        const firstMatch = userMatchList[0];
        const userEmail = firstMatch.userEmail;

        // Fetch full query details
        const queryIds = userMatchList.map((m) => m.queryId);
        const { data: queries, error } = await supabase
          .from('queries')
          .select('*')
          .in('id', queryIds);

        if (error || !queries) {
          console.error(`Error fetching queries for user ${userId}:`, error);
          continue;
        }

        // Prepare email data
        const emailData: NewMatchEmailData = {
          userName: userEmail.split('@')[0], // Extract name from email
          queries: queries.map((query) => {
            const match = userMatchList.find((m) => m.queryId === query.id);
            return {
              headline: query.headline,
              publication: query.publication,
              deadline: new Date(query.deadline),
              matchedKeywords: match?.matchedKeywords || [],
              isUrgent: isDeadlineUrgent(new Date(query.deadline)),
            };
          }),
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
        };

        // Generate and send email
        const html = generateNewMatchEmail(emailData);
        const subject = `🎯 ${queries.length} New HARO ${queries.length === 1 ? 'Match' : 'Matches'} Found!`;

        const sent = await sendEmail(userEmail, subject, html);

        if (sent) {
          notificationsSent++;

          // Log notification
          await logNotification(
            userId,
            'new_match',
            queryIds,
            'sent'
          );
        } else {
          await logNotification(
            userId,
            'new_match',
            queryIds,
            'failed',
            'Failed to send email'
          );
        }
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        await logNotification(
          userId,
          'new_match',
          [],
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    return notificationsSent;
  } catch (error) {
    console.error('Error in sendNewMatchNotifications:', error);
    return notificationsSent;
  }
}

/**
 * Send daily digest emails to users
 * @returns Number of digests sent successfully
 */
export async function sendDailyDigests(): Promise<number> {
  const supabase = await getSupabaseServerClient();
  let digestsSent = 0;

  try {
    // Get all users with daily digest enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email_daily_digest', true);

    if (usersError || !users) {
      console.error('Error fetching users for daily digest:', usersError);
      return 0;
    }

    // For each user, get queries from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    for (const user of users) {
      try {
        // Fetch user's queries from last 24 hours
        const { data: userQueries, error } = await supabase
          .from('user_queries')
          .select(`
            id,
            matched_keywords,
            queries!inner (
              id,
              headline,
              publication,
              deadline,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .gte('queries.created_at', yesterday.toISOString())
          .order('queries.created_at', { ascending: false });

        if (error) {
          console.error(`Error fetching queries for user ${user.id}:`, error);
          continue;
        }

        const queryCount = userQueries?.length || 0;

        // Prepare email data
        const emailData: DigestEmailData = {
          userName: user.email.split('@')[0],
          date: new Date(),
          queries: (userQueries || []).map((uq) => {
            const query = Array.isArray(uq.queries) ? uq.queries[0] : uq.queries;
            return {
              headline: query.headline,
              publication: query.publication,
              deadline: new Date(query.deadline),
              matchedKeywords: uq.matched_keywords,
            };
          }),
          totalMatches: queryCount,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
        };

        // Generate and send digest
        const html = generateDigestEmail(emailData);
        const subject = `📊 Your Daily HARO Digest - ${queryCount} ${queryCount === 1 ? 'Match' : 'Matches'}`;

        const sent = await sendEmail(user.email, subject, html);

        if (sent) {
          digestsSent++;

          // Log notification
          const queryIds = (userQueries || []).map((uq) => {
            const query = Array.isArray(uq.queries) ? uq.queries[0] : uq.queries;
            return query.id;
          });

          await logNotification(
            user.id,
            'daily_digest',
            queryIds,
            'sent'
          );
        } else {
          await logNotification(
            user.id,
            'daily_digest',
            [],
            'failed',
            'Failed to send email'
          );
        }
      } catch (error) {
        console.error(`Error sending digest to user ${user.id}:`, error);
        await logNotification(
          user.id,
          'daily_digest',
          [],
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    return digestsSent;
  } catch (error) {
    console.error('Error in sendDailyDigests:', error);
    return digestsSent;
  }
}

/**
 * Log notification to database
 */
async function logNotification(
  userId: string,
  notificationType: 'new_match' | 'daily_digest' | 'urgent',
  queryIds: string[],
  status: 'sent' | 'failed' | 'bounced',
  errorMessage?: string
) {
  const supabase = await getSupabaseServerClient();

  try {
    await supabase.from('email_notifications').insert({
      user_id: userId,
      notification_type: notificationType,
      query_ids: queryIds,
      status,
      error_message: errorMessage,
    });
  } catch (error) {
    console.error('Error logging notification:', error);
    // Don't throw - logging should not fail the notification process
  }
}
