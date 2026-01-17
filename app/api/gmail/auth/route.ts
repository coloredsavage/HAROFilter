import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/gmail/auth';

/**
 * OAuth2 callback handler for Gmail API
 * This route receives the authorization code and exchanges it for tokens
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle user denial
  if (error) {
    return NextResponse.json(
      { error: 'Authorization denied', details: error },
      { status: 400 }
    );
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.json(
      { error: 'Authorization code not found' },
      { status: 400 }
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Return tokens (in production, you should store these securely)
    return NextResponse.json({
      success: true,
      message: 'Authorization successful! Save these tokens to your environment variables.',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
      },
      instructions: {
        step1: 'Copy the refresh_token value',
        step2: 'Add it to your .env.local file as GMAIL_REFRESH_TOKEN',
        step3: 'Restart your development server',
        step4: 'Run the test-gmail script to verify: npm run test-gmail',
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      {
        error: 'Failed to exchange authorization code for tokens',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
