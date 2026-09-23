import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { calendarConnections } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL('/login', req.url));

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const provider = searchParams.get('state') || searchParams.get('provider') || 'google';

  if (code && provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${new URL(req.url).origin}/api/calendar/callback`;

    if (clientId && clientSecret) {
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (tokenRes.ok) {
          const tokens = await tokenRes.json();
          
          const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          
          let email = `unknown@${provider}.com`;
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.email) email = userData.email;
          }

          // If they don't get a refresh token, this might be a problem for long-term sync, but it's okay for now.
          await db.insert(calendarConnections).values({
            userId: session.user.id,
            provider: provider,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
            email: email,
          }).onConflictDoUpdate({
            target: [calendarConnections.userId, calendarConnections.provider, calendarConnections.email],
            set: {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token || null,
              expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
              updatedAt: new Date()
            }
          });
        } else {
          console.error('Failed to get tokens', await tokenRes.text());
        }
      } catch (err) {
        console.error('Error in OAuth callback', err);
      }
    } else {
      console.error('Missing Google Client ID or Secret');
    }
  } else if (searchParams.get('status') === 'success') {
    // Fallback for mock if provider is not Google or code is absent but status is success
    await db.insert(calendarConnections).values({
      userId: session.user.id,
      provider: provider,
      accessToken: 'mock_access_token_' + Date.now(),
      email: `mockuser_${Date.now()}@${provider}.com`,
    });
  }

  return NextResponse.redirect(new URL('/settings/calendar', req.url));
}
