import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Cleanup cron job
 * Runs daily at 2:00 AM to delete old queries and logs
 *
 * Vercel Cron: /api/cron/cleanup
 * Schedule: 0 2 * * * (2:00 AM daily)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security (required)
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧹 Starting cleanup cron job...');

    const supabase = await getSupabaseServerClient();

    // Calculate cutoff dates
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let queriesDeleted = 0;
    let userQueriesDeleted = 0;
    let logsDeleted = 0;

    // Step 1: Delete queries older than 30 days
    try {
      const { data: oldQueries, error: queryError } = await supabase
        .from('queries')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .select('id');

      if (queryError) {
        console.error('Error deleting old queries:', queryError);
      } else {
        queriesDeleted = oldQueries?.length || 0;
        console.log(`🗑️  Deleted ${queriesDeleted} queries older than 30 days`);
      }
    } catch (error) {
      console.error('Error in query cleanup:', error);
    }

    // Step 2: Delete orphaned user_queries (queries that no longer exist)
    try {
      // First, get all query IDs that exist
      const { data: existingQueries } = await supabase
        .from('queries')
        .select('id');

      const existingQueryIds = new Set((existingQueries || []).map(q => q.id));

      // Get all user_queries
      const { data: allUserQueries } = await supabase
        .from('user_queries')
        .select('id, query_id');

      // Find orphaned user_queries
      const orphanedIds = (allUserQueries || [])
        .filter(uq => !existingQueryIds.has(uq.query_id))
        .map(uq => uq.id);

      if (orphanedIds.length > 0) {
        const { error: userQueryError } = await supabase
          .from('user_queries')
          .delete()
          .in('id', orphanedIds);

        if (userQueryError) {
          console.error('Error deleting orphaned user_queries:', userQueryError);
        } else {
          userQueriesDeleted = orphanedIds.length;
          console.log(`🗑️  Deleted ${userQueriesDeleted} orphaned user_queries`);
        }
      }
    } catch (error) {
      console.error('Error in user_queries cleanup:', error);
    }

    // Step 3: Delete processing logs older than 90 days
    try {
      const { data: oldLogs, error: logsError } = await supabase
        .from('haro_processing_logs')
        .delete()
        .lt('created_at', ninetyDaysAgo.toISOString())
        .select('id');

      if (logsError) {
        console.error('Error deleting old logs:', logsError);
      } else {
        logsDeleted = oldLogs?.length || 0;
        console.log(`🗑️  Deleted ${logsDeleted} processing logs older than 90 days`);
      }
    } catch (error) {
      console.error('Error in logs cleanup:', error);
    }

    const summary = {
      success: true,
      queriesDeleted,
      userQueriesDeleted,
      logsDeleted,
      processingTimeMs: Date.now() - startTime,
    };

    console.log('✅ Cleanup complete:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('❌ Cleanup cron job failed:', error);

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
