import { NextRequest, NextResponse } from 'next/server';
import { sendDailyDigests } from '@/lib/services/notification-service';

/**
 * Daily digest cron job
 * Runs daily at 8:00 AM to send digest emails to users
 *
 * Vercel Cron: /api/cron/digest
 * Schedule: 0 8 * * * (8:00 AM daily)
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

    console.log('📊 Starting daily digest cron job...');

    // Send daily digests to all users with digest enabled
    const digestsSent = await sendDailyDigests();

    const summary = {
      success: true,
      digestsSent,
      processingTimeMs: Date.now() - startTime,
    };

    console.log('✅ Daily digest complete:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('❌ Daily digest cron job failed:', error);

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
