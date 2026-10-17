
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  // Exchange code for tokens
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: JSON.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GMAIL_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await response.json();
  if (tokens.error) return NextResponse.json({ error: tokens.error }, { status: 400 });

  // Encrypt and save to Supabase
  // Mock encryption for now (as requested in PRD: TOKEN_ENCRYPTION_KEY)
  const encryptedToken = `ENC:${tokens.refresh_token}`;

  // We need to know which user is logging in. Usually state carries the userId.
  const userId = state; 

  if (!userId) return NextResponse.json({ error: 'No user state' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('gmail_connections')
    .upsert({
      user_id: userId,
      email: tokens.email || 'unknown',
      refresh_token_enc: encryptedToken,
      scopes: ['https://www.googleapis.com/auth/gmail.compose'],
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL('/dashboard', req.url));
}
