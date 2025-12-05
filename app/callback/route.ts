import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Enable edge runtime for ultra-low latency
export const runtime = 'edge';

/**
 * GET /callback
 * OAuth callback - exchanges code for access token
 */
export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const configurationId = searchParams.get('configurationId');

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://api.vercel.com/v2/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.INTEGRATION_CLIENT_ID,
      client_secret: env.INTEGRATION_CLIENT_SECRET,
      code,
      redirect_uri: `${getBaseUrl(request)}/callback`,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('[Callback] Token exchange failed:', error);
    return NextResponse.json(
      { error: 'Token exchange failed' },
      { status: 400 }
    );
  }

  const tokenData = await tokenResponse.json();
  console.log('[Callback] Token exchange successful:', {
    installation_id: tokenData.installation_id,
    user_id: tokenData.user_id,
    team_id: tokenData.team_id,
  });

  // Redirect to dashboard or back to Vercel
  if (next) {
    return NextResponse.redirect(next);
  }

  // If no next URL, redirect to our dashboard
  return NextResponse.redirect(`${getBaseUrl(request)}/dashboard?configurationId=${configurationId}`);
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3001';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}
